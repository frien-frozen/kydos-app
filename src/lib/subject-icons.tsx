import type { IconType } from 'react-icons'
import {
  PiCalculatorLight,
  PiAtomLight,
  PiBookOpenLight,
  PiTranslateLight,
  PiGlobeLight,
  PiHandshakeLight,
  PiStarLight,
  PiWrenchLight,
  PiMusicNotesLight,
  PiMicroscopeLight,
  PiMonitorLight,
  PiBrainLight,
} from 'react-icons/pi'

export type SubjectIcon = IconType

export function getSubjectIcon(name: string): SubjectIcon {
  const lower = name.toLowerCase()

  if (lower.includes('math'))                                              return PiCalculatorLight
  if (lower.includes('sci') || lower.includes('bio') ||
      lower.includes('chem') || lower.includes('phys'))                   return PiAtomLight
  if (lower.includes('eng'))                                              return PiBookOpenLight
  if (lower.includes('fil'))                                              return PiTranslateLight
  if (lower.includes('ap') || lower.includes('araling') ||
      lower.includes('social') || lower.includes('history'))              return PiGlobeLight
  if (lower.includes('gmrc'))                                             return PiHandshakeLight
  if (lower.includes('esp'))                                              return PiStarLight
  if (lower.includes('tle') || lower.includes('tech') ||
      lower.includes('livelihood'))                                       return PiWrenchLight
  if (lower.includes('mapeh') || lower.includes('music') ||
      lower.includes('art') || lower.includes('pe'))                      return PiMusicNotesLight
  if (lower.includes('research'))                                         return PiMicroscopeLight
  if (lower.includes('computer') || lower.includes('cs') ||
      lower.includes('coding'))                                           return PiMonitorLight
  if (lower.includes('philosophy') || lower.includes('phylosophy'))       return PiBrainLight

  return PiBookOpenLight
}
