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
  TranslateIcon,
  BusIcon,
  BookOpenIcon,
  BedIcon,
  GraduationCapIcon,
  GlobeIcon,
  ExamIcon,
  MedalIcon,
  WalletIcon,
  TreeStructureIcon,
  HandshakeIcon,
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
  translate: TranslateIcon,
  bell: BellIcon,
  calendar: CalendarBlankIcon,
  clock: ClockIcon,
  briefcase: BriefcaseIcon,
  brain: BrainIcon,
  trophy: TrophyIcon,
  buildings: BuildingsIcon,
  star: StarIcon,
  // The module roles' homes (3 Oct 2026): transport, the library, the hostel, the alumni.
  bus: BusIcon,
  bookOpen: BookOpenIcon,
  bed: BedIcon,
  graduationCap: GraduationCapIcon,
  // The global feed, and the college roles' homes (4 Oct 2026): the HOD's department, the exam cell, IQAC, accounts, the recruiter.
  globe: GlobeIcon,
  treeStructure: TreeStructureIcon,
  exam: ExamIcon,
  medal: MedalIcon,
  wallet: WalletIcon,
  handshake: HandshakeIcon,
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
