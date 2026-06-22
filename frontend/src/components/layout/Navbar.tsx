import { Bell, Moon, Sun, Menu, CheckCheck, Trash2 } from "lucide-react";
import { useTheme } from "next-themes";
import { useNotification } from "@/context/NotificationContext";

import { Avatar, AvatarFallback } from "../ui/avatar";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "../ui/dropdown-menu";

import { useNavigate } from "react-router-dom";
import { useAuth } from "../../context/AuthContext";
import { Button } from "../ui/button";

interface NavbarProps {
  onMenuClick?: () => void;
}

function timeAgo(iso?: string): string {
  if (!iso) return "just now";
  const d = new Date(iso).getTime();
  if (Number.isNaN(d)) return "just now";
  const s = Math.floor((Date.now() - d) / 1000);
  if (s < 60) return "just now";
  const m = Math.floor(s / 60);
  if (m < 60) return `${m}m ago`;
  const h = Math.floor(m / 60);
  if (h < 24) return `${h}h ago`;
  const days = Math.floor(h / 24);
  return `${days}d ago`;
}

export const Navbar = ({ onMenuClick }: NavbarProps) => {
  const { theme, setTheme } = useTheme();
  const { user, logout } = useAuth();
  const navigate = useNavigate();
  const {
    notifications,
    unreadCount,
    markAsRead,
    markAllRead,
    deleteNotification,
  } = useNotification();

  const getInitials = (name?: string): string => {
    if (!name) return "U";
    return name
      .split(" ")
      .map((n) => n[0])
      .join("")
      .toUpperCase();
  };

  return (
    <header className="h-16 border-b border-zinc-200 dark:border-zinc-800 bg-white/80 dark:bg-zinc-900/80 backdrop-blur-md sticky top-0 z-40 px-4 sm:px-6">
      <div className="h-full flex items-center justify-between gap-4">
        <div className="flex items-center gap-2">
          <button
            onClick={onMenuClick}
            className="p-2 rounded-lg hover:bg-zinc-100 dark:hover:bg-zinc-800 transition-colors md:hidden"
            aria-label="Toggle sidebar"
          >
            <Menu className="w-5 h-5" />
          </button>

          <span className="md:hidden font-semibold text-sm bg-gradient-to-r from-blue-600 to-blue-700 bg-clip-text text-transparent">
            TrueLens
          </span>
        </div>

        <div className="flex-1 text-center min-w-0">
          <h1 className="text-xs sm:text-sm md:text-lg lg:text-xl font-semibold text-zinc-900 dark:text-white tracking-wide truncate px-2">
            AI Powered News Intelligence
          </h1>
        </div>

        <div className="flex items-center gap-1 sm:gap-3 flex-shrink-0">
          <Button
            variant="ghost"
            size="icon"
            className="h-9 w-9"
            onClick={() => setTheme(theme === "dark" ? "light" : "dark")}
          >
            {theme === "dark" ? (
              <Sun className="h-4 w-4" />
            ) : (
              <Moon className="h-4 w-4" />
            )}
          </Button>

          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <button className="relative p-2 rounded-lg hover:bg-zinc-100 dark:hover:bg-zinc-800 transition-colors">
                <Bell className="w-5 h-5" />
                {unreadCount > 0 && (
                  <span className="absolute -top-1 -right-1 bg-red-500 text-white text-xs px-1.5 rounded-full">
                    {unreadCount > 9 ? "9+" : unreadCount}
                  </span>
                )}
              </button>
            </DropdownMenuTrigger>

            <DropdownMenuContent align="end" className="w-80 sm:w-96">
              <div className="flex items-center justify-between px-2 py-1.5">
                <DropdownMenuLabel className="p-0">Notifications</DropdownMenuLabel>
                {notifications.length > 0 && (
                  <button
                    onClick={(e) => {
                      e.preventDefault();
                      markAllRead();
                    }}
                    className="flex items-center gap-1 text-xs text-blue-600 hover:underline"
                  >
                    <CheckCheck className="w-3.5 h-3.5" />
                    Mark all read
                  </button>
                )}
              </div>
              <DropdownMenuSeparator />

              {notifications.length === 0 ? (
                <DropdownMenuItem disabled>No notifications</DropdownMenuItem>
              ) : (
                <div className="max-h-96 overflow-y-auto">
                  {notifications.map((n) => (
                    <DropdownMenuItem
                      key={n.id}
                      onClick={() => {
                        markAsRead(n.id);
                        if (n.link) navigate(n.link);
                      }}
                      className={`flex items-start gap-2 p-2 ${
                        !n.read ? "bg-zinc-100 dark:bg-zinc-800" : ""
                      }`}
                    >
                      <span
                        className={`mt-1.5 h-2 w-2 flex-shrink-0 rounded-full ${
                          n.read ? "bg-transparent" : "bg-blue-500"
                        }`}
                      />
                      <div className="flex flex-col gap-0.5 min-w-0 flex-1">
                        {n.title && (
                          <span className="text-sm font-medium truncate">
                            {n.title}
                          </span>
                        )}
                        <span className="text-sm text-zinc-600 dark:text-zinc-300 break-words">
                          {n.message}
                        </span>
                        <span className="text-xs text-zinc-500">
                          {timeAgo(n.createdAt)}
                        </span>
                      </div>
                      <button
                        onClick={(e) => {
                          e.preventDefault();
                          e.stopPropagation();
                          deleteNotification(n.id);
                        }}
                        className="text-zinc-400 hover:text-red-500 p-1"
                        aria-label="Delete notification"
                      >
                        <Trash2 className="w-3.5 h-3.5" />
                      </button>
                    </DropdownMenuItem>
                  ))}
                </div>
              )}
            </DropdownMenuContent>
          </DropdownMenu>

          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <button className="rounded-full hover:ring-2 hover:ring-blue-500 transition-all">
                <Avatar className="h-8 w-8">
                  <AvatarFallback className="text-xs">
                    {user ? getInitials(user.fullName) : "U"}
                  </AvatarFallback>
                </Avatar>
              </button>
            </DropdownMenuTrigger>

            <DropdownMenuContent align="end">
              <DropdownMenuLabel className="truncate">
                {user?.fullName}
              </DropdownMenuLabel>
              <DropdownMenuSeparator />
              <DropdownMenuItem onClick={() => navigate("/profile")}>Profile</DropdownMenuItem>
              <DropdownMenuItem onClick={() => navigate("/settings")}>Settings</DropdownMenuItem>
              <DropdownMenuSeparator />
              <DropdownMenuItem onClick={logout} className="text-red-600">Logout</DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>
        </div>
      </div>
    </header>
  );
};
