/**
 * @file index.ts
 * @description 인시던트 탭 위젯 공개 API
 * @module widgets/incident-tab
 */
export { default as IncidentTab } from './ui/IncidentTab';
export type { DatePreset, IncidentTabDateProps } from './ui/IncidentTab';
export { getDateRange, DATE_PRESETS } from './ui/IncidentTab';
