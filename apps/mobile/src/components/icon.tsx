import type { ComponentProps } from "react";
import {
  ArchiveIcon, BellIcon, BrainIcon, BriefcaseIcon, BuildingsIcon, CalendarIcon, CameraIcon, ChalkboardIcon, ChartLineIcon, ChatIcon,
  CheckIcon, ChecksIcon, CircleIcon, ClipboardTextIcon, ClockIcon, DeviceMobileIcon, DotsThreeOutlineIcon, EnvelopeIcon, GearIcon,
  HouseIcon, MegaphoneIcon, PaletteIcon, PaperPlaneTiltIcon, PlusIcon, ShieldIcon, SignOutIcon, StarIcon, TranslateIcon, TrophyIcon,
  UserIcon, UsersIcon, WarningIcon, XIcon,
} from "phosphor-react-native";

/**
 * The web's nav icon names (lib/nav.ts) in Phosphor — the same family the web
 * draws — imported one by one, because the package holds 1,500 icons and a
 * star import would put every one of them in the bundle.
 */
const MAP = {
  house: HouseIcon, checks: ChecksIcon, chalkboard: ChalkboardIcon, chat: ChatIcon, clipboard: ClipboardTextIcon, brain: BrainIcon,
  users: UsersIcon, calendar: CalendarIcon, chartLine: ChartLineIcon, bell: BellIcon, gear: GearIcon, user: UserIcon, clock: ClockIcon,
  star: StarIcon, trophy: TrophyIcon, archive: ArchiveIcon, briefcase: BriefcaseIcon, buildings: BuildingsIcon, envelope: EnvelopeIcon,
  megaphone: MegaphoneIcon, palette: PaletteIcon, plus: PlusIcon, shield: ShieldIcon, dots: DotsThreeOutlineIcon, signOut: SignOutIcon,
  translate: TranslateIcon, devices: DeviceMobileIcon, check: CheckIcon, x: XIcon, warning: WarningIcon, camera: CameraIcon, paperPlane: PaperPlaneTiltIcon,
} as const;

export type IconName = keyof typeof MAP;

export function Icon({ name, ...rest }: { name: string } & Omit<ComponentProps<typeof HouseIcon>, "ref">) {
  const Cmp = MAP[name as IconName] ?? CircleIcon;
  return <Cmp {...rest} />;
}
