import { useMemo, useState } from "react";
import { getAssetUrl } from "../services/apiConfig";

const sizeClasses = {
  sm: "h-8 w-8 text-xs",
  md: "h-10 w-10 text-sm",
  lg: "h-14 w-14 text-lg",
  xl: "h-28 w-28 text-4xl",
};

const getInitials = (name = "") => {
  const parts = name.trim().split(/\s+/).filter(Boolean);

  if (!parts.length) return "U";

  return parts
    .slice(0, 2)
    .map((part) => part.charAt(0).toUpperCase())
    .join("");
};

const UserAvatar = ({ user, size = "md", className = "" }) => {
  const [failedImageUrl, setFailedImageUrl] = useState("");
  const profilePicture = user?.profilePicture || "";
  const imageUrl = useMemo(() => getAssetUrl(profilePicture), [profilePicture]);
  const initials = getInitials(user?.name);
  const dimensions = sizeClasses[size] || sizeClasses.md;

  if (imageUrl && failedImageUrl !== imageUrl) {
    return (
      <img
        src={imageUrl}
        alt={user?.name ? `${user.name}'s profile picture` : "User profile picture"}
        onError={() => setFailedImageUrl(imageUrl)}
        className={`
          ${dimensions}
          shrink-0 rounded-full object-cover
          border border-violet-400/40 bg-violet-500/10
          ${className}
        `}
      />
    );
  }

  return (
    <div
      aria-label={user?.name ? `${user.name}'s initials` : "User initials"}
      className={`
        ${dimensions}
        shrink-0 rounded-full
        border border-violet-400/40
        bg-gradient-to-br from-violet-500/35 via-fuchsia-500/20 to-sky-500/20
        text-violet-100
        flex items-center justify-center
        font-semibold leading-none
        shadow-[0_0_24px_rgba(139,92,246,0.22)]
        ${className}
      `}
    >
      {initials}
    </div>
  );
};

export default UserAvatar;
