import { BOARD_COLUMNS, STATS } from "./landingData";

export default function BoardPreviewSection() {
  return (
    <section className="max-w-5xl mx-auto px-6 pb-16">
      <div
        className="bg-gray-50 border border-gray-200 rounded-2xl
        p-5"
      >
        <p className="text-xs text-gray-400 font-medium mb-4">
          Live Kanban board preview
        </p>
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3">
          {BOARD_COLUMNS.map((col) => (
            <div key={col.label}>
              <div className="flex items-center gap-1.5 mb-2">
                <div
                  className="w-2 h-2 rounded-full"
                  style={{ backgroundColor: col.color }}
                />
                <span className="text-xs font-medium text-gray-500">
                  {col.label}
                </span>
              </div>
              {col.tasks.map((task) => (
                <div
                  key={task.title}
                  className="bg-white border border-gray-200
                  rounded-lg p-2.5 mb-2"
                >
                  <p className="text-xs font-medium text-gray-800 mb-2">
                    {task.title}
                  </p>
                  <div className="flex items-center justify-between">
                    <span
                      className="text-xs px-1.5 py-0.5 rounded-full
                      font-medium"
                      style={{
                        background: task.priorityBg,
                        color: task.priorityColor,
                      }}
                    >
                      {task.priority}
                    </span>
                    <div
                      className="w-5 h-5 rounded-full flex items-center
                      justify-center text-xs font-medium"
                      style={{
                        background: task.avatarBg,
                        color: task.avatarColor,
                      }}
                    >
                      {task.avatar}
                    </div>
                  </div>
                </div>
              ))}
            </div>
          ))}
        </div>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 mt-4">
        {STATS.map((stat) => (
          <div
            key={stat.label}
            className="bg-gray-50 border border-gray-200
            rounded-xl p-4 text-center"
          >
            <div className="text-2xl font-semibold text-indigo-600 mb-1">
              {stat.value}
            </div>
            <div className="text-xs text-gray-500">{stat.label}</div>
          </div>
        ))}
      </div>
    </section>
  );
}
