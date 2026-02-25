/**
 * @file hooks.ts
 * @description 타입 안전한 Redux 디스패치·셀렉터 훅
 * @module shared/store
 */
import { useDispatch, useSelector, type TypedUseSelectorHook } from 'react-redux';
import type { RootState, AppDispatch } from '@/shared/store/store';

export const useAppDispatch = () => useDispatch<AppDispatch>();
export const useAppSelector: TypedUseSelectorHook<RootState> = useSelector;
