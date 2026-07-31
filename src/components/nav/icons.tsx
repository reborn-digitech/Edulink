"use client";

import {
  BellIcon,
  ChalkboardTeacherIcon,
  ChartLineUpIcon,
  ChatCircleDotsIcon,
  ChecksIcon,
  ClipboardTextIcon,
  EnvelopeSimpleIcon,
  GearIcon,
  HouseIcon,
  MegaphoneIcon,
  PaletteIcon,
  PlusIcon,
  ShieldCheckIcon,
  TrophyIcon,
  UserCirclePlusIcon,
  UserIcon,
  UsersThreeIcon,
  type Icon,
} from "@phosphor-icons/react";

/**
 * Name -> icon map so `src/lib/nav.ts` can stay a plain data module usable from
 * server components, while the icons themselves stay client-side.
 */
const ICONS: Record<string, Icon> = {
  house: HouseIcon,
  users: UsersThreeIcon,
  chalkboard: ChalkboardTeacherIcon,
  envelope: EnvelopeSimpleIcon,
  megaphone: MegaphoneIcon,
  shield: ShieldCheckIcon,
  gear: GearIcon,
  checks: ChecksIcon,
  clipboard: ClipboardTextIcon,
  chat: ChatCircleDotsIcon,
  chartLine: ChartLineUpIcon,
  user: UserIcon,
  userPlus: UserCirclePlusIcon,
  plus: PlusIcon,
  palette: PaletteIcon,
  bell: BellIcon,
  trophy: TrophyIcon,
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
