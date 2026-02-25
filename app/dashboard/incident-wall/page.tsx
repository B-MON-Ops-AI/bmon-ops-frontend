/**
 * @file page.tsx
 * @description 인시던트 월 리다이렉트 페이지
 * @module app/dashboard/incident-wall
 */
import { redirect } from 'next/navigation';

export default function IncidentWallRedirect() {
  redirect('/dashboard');
}
