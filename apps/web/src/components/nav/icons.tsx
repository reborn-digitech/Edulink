"use client";

import {
  BellIcon,
  BooksIcon,
  BrainIcon,
  BuildingsIcon,
  StarIcon,
  CalendarBlankIcon,
  ChalkboardTeacherIcon,
  ChartLineUpIcon,
  ChatCircleDotsIcon,
  ChatsCircleIcon,
  ChecksIcon,
  ClipboardTextIcon,
  ClockIcon,
  EnvelopeSimpleIcon,
  FirstAidKitIcon,
  GearIcon,
  HeartIcon,
  HouseIcon,
  MegaphoneIcon,
  PaletteIcon,
  PlusIcon,
  ReceiptIcon,
  ShieldCheckIcon,
  TrophyIcon,
  UserCirclePlusIcon,
  UserIcon,
  UsersThreeIcon,
  BriefcaseIcon,
  ArchiveIcon,
  type Icon,
} from "@phosphor-icons/react";

/**
 * Name -> icon map so `src/lib/nav.ts` can stay a plain data module usable from
 * server components, while the icons themselves stay client-side.
 */
const ICONS: Record<string, Icon> = {
  house: HouseIcon,
  books: BooksIcon,
  archive: ArchiveIcon,
  users: UsersThreeIcon,
  chalkboard: ChalkboardTeacherIcon,
  envelope: EnvelopeSimpleIcon,
  megaphone: MegaphoneIcon,
  shield: ShieldCheckIcon,
  gear: GearIcon,
  heart: HeartIcon,
  firstAidKit: FirstAidKitIcon,
  checks: ChecksIcon,
  clipboard: ClipboardTextIcon,
  chat: ChatCircleDotsIcon,
  chatsCircle: ChatsCircleIcon,
  chartLine: ChartLineUpIcon,
  user: UserIcon,
  userPlus: UserCirclePlusIcon,
  plus: PlusIcon,
  receipt: ReceiptIcon,
  palette: PaletteIcon,
  bell: BellIcon,
  calendar: CalendarBlankIcon,
  clock: ClockIcon,
  briefcase: BriefcaseIcon,
  brain: BrainIcon,
  trophy: TrophyIcon,
  buildings: BuildingsIcon,
  star: StarIcon,
};

export function NavIcon({
  name,
  className,
  weight = "regular",
}: {
  name: string;
  className?: string;
  weight?: "regular" | "bold" | "fill" | "duotone";
}) {
  const Component = ICONS[name] ?? HouseIcon;
  return <Component className={className} weight={weight} aria-hidden="true" />;
}
