'use client';

/**
 * @file NotificationTab.tsx
 * @description 알림 설정 폼 컴포넌트 (Slack, 수신자)
 * @module features/settings/ui
 */

import { useEffect, useState } from 'react';
import Box from '@mui/material/Box';
import TextField from '@mui/material/TextField';
import Button from '@mui/material/Button';
import Typography from '@mui/material/Typography';
import CircularProgress from '@mui/material/CircularProgress';
import Divider from '@mui/material/Divider';
import SendIcon from '@mui/icons-material/Send';
import SaveIcon from '@mui/icons-material/Save';
import { useNotifications, useUpdateNotifications, useTestNotification } from '@/features/settings/model/useSettings';
import { useAppDispatch, showSnackbar } from '@/shared/store';
import type { NotificationSettings } from '@/entities/settings';

export default function NotificationTab() {
  const dispatch = useAppDispatch();
  const { data, isLoading } = useNotifications();
  const { mutate: updateNotifications, isPending: saving } = useUpdateNotifications();
  const { mutate: testNotification, isPending: testing } = useTestNotification();

  const [form, setForm] = useState<NotificationSettings>({
    slackWebhookUrl: '',
    receivers: { critical: [], warning: [], info: [] },
  });

  useEffect(() => {
    if (data) setForm(data);
  }, [data]);

  const setField = (field: keyof NotificationSettings, value: unknown) => {
    setForm((prev) => ({ ...prev, [field]: value }));
  };

  const setReceivers = (level: keyof NotificationSettings['receivers'], value: string) => {
    setForm((prev) => ({
      ...prev,
      receivers: { ...prev.receivers, [level]: value.split(',').map((v) => v.trim()).filter(Boolean) },
    }));
  };

  const handleSave = () => {
    updateNotifications(form, {
      onSuccess: () => dispatch(showSnackbar({ message: '알림 설정이 저장되었습니다.', severity: 'success' })),
      onError: () => dispatch(showSnackbar({ message: '저장에 실패했습니다.', severity: 'error' })),
    });
  };

  const handleTest = () => {
    testNotification(undefined, {
      onSuccess: () => dispatch(showSnackbar({ message: '테스트 알림이 전송되었습니다.', severity: 'success' })),
      onError: () => dispatch(showSnackbar({ message: '테스트 전송에 실패했습니다.', severity: 'error' })),
    });
  };

  if (isLoading) {
    return (
      <Box sx={{ display: 'flex', justifyContent: 'center', py: 4 }}>
        <CircularProgress />
      </Box>
    );
  }

  return (
    <Box sx={{ maxWidth: 600, display: 'flex', flexDirection: 'column', gap: 3 }}>
      <Box>
        <Typography variant="subtitle2" mb={1}>Slack Webhook URL</Typography>
        <TextField
          fullWidth
          size="small"
          placeholder="https://hooks.slack.com/services/..."
          value={form.slackWebhookUrl}
          onChange={(e) => setField('slackWebhookUrl', e.target.value)}
        />
      </Box>

      <Divider />

      <Box>
        <Typography variant="subtitle2" mb={2}>수신자 설정 (이메일 또는 슬랙ID, 쉼표로 구분)</Typography>
        <Box sx={{ display: 'flex', flexDirection: 'column', gap: 2 }}>
          {(['critical', 'warning', 'info'] as const).map((level) => (
            <Box key={level} sx={{ display: 'flex', gap: 2, alignItems: 'center' }}>
              <Typography
                variant="body2"
                fontWeight={600}
                sx={{
                  width: 70,
                  color: level === 'critical' ? '#DC2626' : level === 'warning' ? '#F59E0B' : '#3B82F6',
                }}
              >
                {level.toUpperCase()}
              </Typography>
              <TextField
                fullWidth
                size="small"
                placeholder="user@example.com, @slackuser"
                value={form.receivers[level].join(', ')}
                onChange={(e) => setReceivers(level, e.target.value)}
              />
            </Box>
          ))}
        </Box>
      </Box>

      <Box sx={{ display: 'flex', gap: 2 }}>
        <Button
          variant="contained"
          startIcon={<SaveIcon />}
          onClick={handleSave}
          disabled={saving}
        >
          저장
        </Button>
        <Button
          variant="outlined"
          startIcon={<SendIcon />}
          onClick={handleTest}
          disabled={testing}
        >
          테스트 전송
        </Button>
      </Box>
    </Box>
  );
}
