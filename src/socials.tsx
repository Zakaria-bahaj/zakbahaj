import type { IconType } from "react-icons";
import { FaInstagram, FaBehance, FaDribbble, FaLinkedinIn, FaXTwitter, FaFacebookF, FaTiktok, FaYoutube, FaPinterestP, FaSnapchat, FaTelegram, FaWhatsapp, FaGithub } from "react-icons/fa6";
export const PLATFORMS: { key: string; label: string; Icon: IconType }[] = [
  { key: "instagram", label: "Instagram", Icon: FaInstagram }, { key: "behance", label: "Behance", Icon: FaBehance },
  { key: "dribbble", label: "Dribbble", Icon: FaDribbble }, { key: "linkedin", label: "LinkedIn", Icon: FaLinkedinIn },
  { key: "x", label: "X", Icon: FaXTwitter }, { key: "facebook", label: "Facebook", Icon: FaFacebookF },
  { key: "tiktok", label: "TikTok", Icon: FaTiktok }, { key: "youtube", label: "YouTube", Icon: FaYoutube },
  { key: "pinterest", label: "Pinterest", Icon: FaPinterestP }, { key: "snapchat", label: "Snapchat", Icon: FaSnapchat },
  { key: "telegram", label: "Telegram", Icon: FaTelegram }, { key: "whatsapp", label: "WhatsApp", Icon: FaWhatsapp },
  { key: "github", label: "GitHub", Icon: FaGithub },
];
