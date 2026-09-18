import type { ComponentProps } from "react";
import { ArchiveIcon } from "phosphor-react-native/src/icons/Archive";
import { BellIcon } from "phosphor-react-native/src/icons/Bell";
import { BrainIcon } from "phosphor-react-native/src/icons/Brain";
import { BriefcaseIcon } from "phosphor-react-native/src/icons/Briefcase";
import { BuildingsIcon } from "phosphor-react-native/src/icons/Buildings";
import { CalendarIcon } from "phosphor-react-native/src/icons/Calendar";
import { CameraIcon } from "phosphor-react-native/src/icons/Camera";
import { CaretRightIcon } from "phosphor-react-native/src/icons/CaretRight";
import { ChalkboardIcon } from "phosphor-react-native/src/icons/Chalkboard";
import { ChartLineIcon } from "phosphor-react-native/src/icons/ChartLine";
import { ChatIcon } from "phosphor-react-native/src/icons/Chat";
import { CheckIcon } from "phosphor-react-native/src/icons/Check";
import { ChecksIcon } from "phosphor-react-native/src/icons/Checks";
import { CircleIcon } from "phosphor-react-native/src/icons/Circle";
import { ClipboardTextIcon } from "phosphor-react-native/src/icons/ClipboardText";
import { ClockIcon } from "phosphor-react-native/src/icons/Clock";
import { DeviceMobileIcon } from "phosphor-react-native/src/icons/DeviceMobile";
import { DotsThreeOutlineIcon } from "phosphor-react-native/src/icons/DotsThreeOutline";
import { EnvelopeIcon } from "phosphor-react-native/src/icons/Envelope";
import { GearIcon } from "phosphor-react-native/src/icons/Gear";
import { HouseIcon } from "phosphor-react-native/src/icons/House";
import { MegaphoneIcon } from "phosphor-react-native/src/icons/Megaphone";
import { PaletteIcon } from "phosphor-react-native/src/icons/Palette";
import { PaperPlaneTiltIcon } from "phosphor-react-native/src/icons/PaperPlaneTilt";
import { PlusIcon } from "phosphor-react-native/src/icons/Plus";
import { ShieldIcon } from "phosphor-react-native/src/icons/Shield";
import { SignOutIcon } from "phosphor-react-native/src/icons/SignOut";
import { StarIcon } from "phosphor-react-native/src/icons/Star";
import { TranslateIcon } from "phosphor-react-native/src/icons/Translate";
import { TrayIcon } from "phosphor-react-native/src/icons/Tray";
import { TrophyIcon } from "phosphor-react-native/src/icons/Trophy";
import { UserIcon } from "phosphor-react-native/src/icons/User";
import { UsersIcon } from "phosphor-react-native/src/icons/Users";
import { WarningIcon } from "phosphor-react-native/src/icons/Warning";
import { XIcon } from "phosphor-react-native/src/icons/X";
import { HandsClappingIcon } from "phosphor-react-native/src/icons/HandsClapping";
import { LightbulbIcon } from "phosphor-react-native/src/icons/Lightbulb";
import { HeartIcon } from "phosphor-react-native/src/icons/Heart";
import { ConfettiIcon } from "phosphor-react-native/src/icons/Confetti";
import { HandsPrayingIcon } from "phosphor-react-native/src/icons/HandsPraying";
import { MedalIcon } from "phosphor-react-native/src/icons/Medal";
import { CaretLeftIcon } from "phosphor-react-native/src/icons/CaretLeft";
import { CheckCircleIcon } from "phosphor-react-native/src/icons/CheckCircle";
import { WarningCircleIcon } from "phosphor-react-native/src/icons/WarningCircle";
import { InfoIcon } from "phosphor-react-native/src/icons/Info";
import { EyeIcon } from "phosphor-react-native/src/icons/Eye";
import { PrinterIcon } from "phosphor-react-native/src/icons/Printer";
import { WifiSlashIcon } from "phosphor-react-native/src/icons/WifiSlash";
import { XCircleIcon } from "phosphor-react-native/src/icons/XCircle";
import { ArrowsClockwiseIcon } from "phosphor-react-native/src/icons/ArrowsClockwise";
import { ClockCounterClockwiseIcon } from "phosphor-react-native/src/icons/ClockCounterClockwise";
import { FlagIcon } from "phosphor-react-native/src/icons/Flag";
import { PlayIcon } from "phosphor-react-native/src/icons/Play";
import { PaperclipIcon } from "phosphor-react-native/src/icons/Paperclip";
import { FileTextIcon } from "phosphor-react-native/src/icons/FileText";
import { ExportIcon } from "phosphor-react-native/src/icons/Export";
import { ChatCircleDotsIcon } from "phosphor-react-native/src/icons/ChatCircleDots";
import { HandshakeIcon } from "phosphor-react-native/src/icons/Handshake";
import { GlobeIcon } from "phosphor-react-native/src/icons/Globe";
import { HandHeartIcon } from "phosphor-react-native/src/icons/HandHeart";
import { BooksIcon } from "phosphor-react-native/src/icons/Books";
import { SealQuestionIcon } from "phosphor-react-native/src/icons/SealQuestion";
import { PencilSimpleIcon } from "phosphor-react-native/src/icons/PencilSimple";
import { ArrowSquareOutIcon } from "phosphor-react-native/src/icons/ArrowSquareOut";
import { UserPlusIcon } from "phosphor-react-native/src/icons/UserPlus";
import { ImageIcon } from "phosphor-react-native/src/icons/Image";
import { ReceiptIcon } from "phosphor-react-native/src/icons/Receipt";
import { ChatsCircleIcon } from "phosphor-react-native/src/icons/ChatsCircle";

/**
 * The web's nav icon names (lib/nav.ts) in Phosphor — the same family the web
 * draws — each from its own file, because the package holds 1,512 icons and
 * Metro does not tree-shake: a named import from the package index put every
 * one of them in the bundle (10.5 MB of Hermes bytecode per platform before
 * this, measured by the bundle-size gate). The types for these paths come
 * from the package's declaration files (tsconfig paths), not its .tsx source,
 * which the exports map would otherwise hand to tsc and which does not pass
 * a strict check on every machine.
 */
const MAP = {
  house: HouseIcon, checks: ChecksIcon, chalkboard: ChalkboardIcon, chat: ChatIcon, clipboard: ClipboardTextIcon, brain: BrainIcon,
  users: UsersIcon, calendar: CalendarIcon, chartLine: ChartLineIcon, bell: BellIcon, gear: GearIcon, user: UserIcon, clock: ClockIcon,
  star: StarIcon, trophy: TrophyIcon, archive: ArchiveIcon, briefcase: BriefcaseIcon, buildings: BuildingsIcon, envelope: EnvelopeIcon,
  megaphone: MegaphoneIcon, palette: PaletteIcon, plus: PlusIcon, shield: ShieldIcon, dots: DotsThreeOutlineIcon, signOut: SignOutIcon,
  translate: TranslateIcon, devices: DeviceMobileIcon, check: CheckIcon, x: XIcon, warning: WarningIcon, camera: CameraIcon, paperPlane: PaperPlaneTiltIcon,
  tray: TrayIcon, caretRight: CaretRightIcon,
  clap: HandsClappingIcon,
  lightbulb: LightbulbIcon,
  heart: HeartIcon,
  confetti: ConfettiIcon,
  handsPraying: HandsPrayingIcon,
  medal: MedalIcon,
  caretLeft: CaretLeftIcon,
  checkCircle: CheckCircleIcon,
  warningCircle: WarningCircleIcon,
  info: InfoIcon,
  eye: EyeIcon,
  printer: PrinterIcon,
  wifiSlash: WifiSlashIcon,
  xCircle: XCircleIcon,
  arrowsClockwise: ArrowsClockwiseIcon,
  clockCounterClockwise: ClockCounterClockwiseIcon,
  flag: FlagIcon,
  play: PlayIcon,
  paperclip: PaperclipIcon,
  fileText: FileTextIcon,
  share: ExportIcon,
  chatDots: ChatCircleDotsIcon,
  handshake: HandshakeIcon,
  globe: GlobeIcon,
  handHeart: HandHeartIcon,
  books: BooksIcon,
  sealQuestion: SealQuestionIcon,
  pencil: PencilSimpleIcon,
  arrowSquareOut: ArrowSquareOutIcon,
  userPlus: UserPlusIcon,
  image: ImageIcon,
  receipt: ReceiptIcon,
  chats: ChatsCircleIcon,
  circle: CircleIcon,
} as const;

export type IconName = keyof typeof MAP;

export function Icon({ name, ...rest }: { name: string } & Omit<ComponentProps<typeof HouseIcon>, "ref">) {
  const Cmp = MAP[name as IconName] ?? CircleIcon;
  return <Cmp {...rest} />;
}
