import { asyncHandler } from "../lib/asyncHandler";
import { Request, Response } from "express";
import { prisma } from "../lib/prisma";
import ApiError from "../lib/ApiError";
import bcrypt from "bcryptjs";
import { generateAccessToken, generateRefreshToken, setTokenCookies, verifyRefreshToken } from "../lib/jwt";
import { OAuth2Client } from "google-auth-library";

const googleClient = new OAuth2Client(process.env.GOOGLE_CLIENT_ID);



export const registerUser = asyncHandler(async (req: Request, res: Response) => {
    const { name, email, password, workspaceName } = req.body;


  // 2. Check if user already exists
  const existingUser = await prisma.user.findUnique({ where: { email } });
  if (existingUser) {
    throw new ApiError('Email already in use', 409);
  }

  // 3. Hash password
  const hashedPassword = await bcrypt.hash(password, 12);

  // 4. Generate workspace slug
  const slug = workspaceName
    .toLowerCase()
    .replace(/[^a-z0-9]/g, '-')
    .replace(/-+/g, '-')
    .trim();

  const existingSlug = await prisma.workspace.findUnique({ where: { slug } });
  const finalSlug = existingSlug ? `${slug}-${Date.now()}` : slug;

  // 5. Create user + workspace + member in one transaction
  const { user, workspace } = await prisma.$transaction(async (tx) => {
    const user = await tx.user.create({
      data: {
        name,
        email,
        password: hashedPassword,
      },
    });

    const workspace = await tx.workspace.create({
      data: {
        name: workspaceName,
        slug: finalSlug,
        members: {
          create: {
            userId: user.id,
            role: 'OWNER',
          },
        },
      },
    });

    return { user, workspace };
  });

  // 6. Generate tokens
  const accessToken = generateAccessToken({
    userId: user.id,
    email: user.email,
  });
  const refreshToken = generateRefreshToken({
    userId: user.id,
    email: user.email,
  });

  // 7. Set cookies
  setTokenCookies(res, accessToken, refreshToken);

  // 8. Return response (never return password)
  res.status(201).json({
    message: 'Account created successfully',
    user: {
      id: user.id,
      name: user.name,
      email: user.email,
    },
    workspace: {
      id: workspace.id,
      name: workspace.name,
      slug: workspace.slug,
      plan: workspace.plan,
    },
  });
});


export const loginUser = asyncHandler(async (req:Request, res:Response) => {
    const { email, password } = req.body;


  const user = await prisma.user.findFirst({where:{email}, 
    include: {
      members: {
        include: { workspace: true },
        orderBy: { joinedAt: 'asc' },
      },
    },
  })

  if(!user || !user.password) throw new ApiError("Incorrect email or password", 401)

  const isPasswordValid = await bcrypt.compare(password, user.password)

    if(!isPasswordValid) throw new ApiError("Incorrect email or password", 401 )

      const accessToken = generateAccessToken({
        userId : user.id,
        email: user.email
      })

      const refreshToken = generateRefreshToken({
        userId: user.id,
        email: user.email
      })


      //set cookie
      setTokenCookies(res, accessToken, refreshToken)


      //return response
     res.json({
    message: 'Login successful',
    user: {
      id: user.id,
      name: user.name,
      email: user.email,
    },
    workspace: user.members[0]?.workspace || null,
    workspaces: user.members.map((m) => ({
      ...m.workspace,
      role: m.role,
    })),
  });
})



export const logout = asyncHandler(async (req: Request, res: Response) => {
  res.clearCookie('access_token');
  res.clearCookie('refresh_token');
  res.json({ message: 'Logged out successfully' });
});





export const refreshToken = asyncHandler(
  async (req: Request, res: Response) => {
    const token = req.cookies.refresh_token;

    if (!token) {
      throw new ApiError('No refresh token', 401);
    }

    // Verify refresh token
    const payload = verifyRefreshToken(token);

    // Check user still exists
    const user = await prisma.user.findUnique({
      where: { id: payload.userId },
    });

    if (!user) {
      throw new ApiError('User no longer exists', 401);
    }

    // Issue new tokens
    const newAccessToken = generateAccessToken({
      userId: user.id,
      email: user.email,
    });
    const newRefreshToken = generateRefreshToken({
      userId: user.id,
      email: user.email,
    });

    setTokenCookies(res, newAccessToken, newRefreshToken);

    res.json({ message: 'Tokens refreshed' });
  }
);


//user profile
export const getMe = asyncHandler(async(req:Request, res:Response) => {
  
  const userId = req.user!.userId;
  if(!userId) throw new ApiError("unauthorized!", 401)

  const user = await prisma.user.findUnique({
 where: { id: userId},
    select: {
      id: true,
      name: true,
      email: true,
      avatarUrl: true,
      createdAt: true,
      members: {
        include: { workspace: true },
        orderBy: { joinedAt: 'asc' },
      },
    },
  })

  if(!user) throw new ApiError("User not found!", 404)

  res.status(200).json({
    message:"User fetched successfully!",
    user
  })
  
})

// Google OAuth Login & Sign-up
export const googleAuth = asyncHandler(async (req: Request, res: Response) => {
  const { idToken, credential } = req.body;
  const token = idToken || credential;

  if (!token) {
    throw new ApiError("Google ID token is required", 400);
  }

  let payload;
  try {
    const ticket = await googleClient.verifyIdToken({
      idToken: token,
      audience: process.env.GOOGLE_CLIENT_ID,
    });
    payload = ticket.getPayload();
  } catch (error: any) {
    throw new ApiError("Invalid or expired Google token", 401);
  }

  if (!payload || !payload.email) {
    throw new ApiError("Unable to extract Google user information", 400);
  }

  const googleId = payload.sub;
  const email = payload.email.toLowerCase();
  const name = payload.name || email.split("@")[0];
  const avatarUrl = payload.picture || null;

  // Check if user exists by googleId or email
  let user = await prisma.user.findFirst({
    where: {
      OR: [
        { googleId },
        { email },
      ],
    },
    include: {
      members: {
        include: { workspace: true },
        orderBy: { joinedAt: "asc" },
      },
    },
  });

  if (user) {
    // If user exists by email but googleId was not yet linked, link it now
    if (!user.googleId || (!user.avatarUrl && avatarUrl)) {
      user = await prisma.user.update({
        where: { id: user.id },
        data: {
          googleId: user.googleId || googleId,
          avatarUrl: user.avatarUrl || avatarUrl,
        },
        include: {
          members: {
            include: { workspace: true },
            orderBy: { joinedAt: "asc" },
          },
        },
      });
    }
  } else {
    // User does not exist -> Create new user with default workspace
    const baseSlug = `${name.toLowerCase().replace(/[^a-z0-9]/g, "-").replace(/-+/g, "-").trim() || "workspace"}`;
    const slug = `${baseSlug}-${Date.now()}`;

    const created = await prisma.$transaction(async (tx) => {
      const newUser = await tx.user.create({
        data: {
          name,
          email,
          googleId,
          avatarUrl,
        },
      });

      const newWorkspace = await tx.workspace.create({
        data: {
          name: `${name}'s Workspace`,
          slug,
          members: {
            create: {
              userId: newUser.id,
              role: "OWNER",
            },
          },
        },
      });

      return { newUser, newWorkspace };
    });

    user = await prisma.user.findUnique({
      where: { id: created.newUser.id },
      include: {
        members: {
          include: { workspace: true },
          orderBy: { joinedAt: "asc" },
        },
      },
    });
  }

  if (!user) {
    throw new ApiError("Failed to process Google authentication", 500);
  }

  const accessToken = generateAccessToken({
    userId: user.id,
    email: user.email,
  });

  const refreshToken = generateRefreshToken({
    userId: user.id,
    email: user.email,
  });

  setTokenCookies(res, accessToken, refreshToken);

  res.status(200).json({
    message: "Google authentication successful",
    user: {
      id: user.id,
      name: user.name,
      email: user.email,
      avatarUrl: user.avatarUrl,
    },
    workspace: user.members[0]?.workspace || null,
    workspaces: user.members.map((m) => ({
      ...m.workspace,
      role: m.role,
    })),
  });
});
