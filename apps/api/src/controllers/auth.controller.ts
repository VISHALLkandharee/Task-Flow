import { asyncHandler } from "../lib/asyncHandler";
import { Request, Response } from "express";
import { prisma } from "../lib/prisma";
import ApiError from "../lib/ApiError";
import bcrypt from "bcryptjs";
import { generateAccessToken, generateRefreshToken, setTokenCookies, verifyRefreshToken } from "../lib/jwt";



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

  if(!user) throw new ApiError("Incorrect email or password", 404)

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
  
  const userId = (req as any).user.userId
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