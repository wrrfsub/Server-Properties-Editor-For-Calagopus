import { Group, Stack, Text } from '@mantine/core';
import { useEffect, useState } from 'react';
import getAllEggs from '@/api/admin/nests/getAllEggs.ts';
import { httpErrorToHuman } from '@/api/axios.ts';
import Button from '@/elements/Button.tsx';
import Card from '@/elements/Card.tsx';
import AdminContentContainer from '@/elements/containers/AdminContentContainer.tsx';
import MultiSelect from '@/elements/input/MultiSelect.tsx';
import { useToast } from '@/providers/ToastProvider.tsx';
import { getAdminConfig, updateAdminConfig } from '../api/client.ts';

interface EggGroup {
  group: string;
  items: Array<{ label: string; value: string }>;
}

export default function AdminServerPropertiesPage() {
  const { addToast } = useToast();
  const [saving, setSaving] = useState(false);
  const [eggOptions, setEggOptions] = useState<EggGroup[]>([]);
  const [selectedEggs, setSelectedEggs] = useState<string[]>([]);

  useEffect(() => {
    getAdminConfig()
      .then((data) => setSelectedEggs(data.allowedEggUuids))
      .catch((error) => addToast(httpErrorToHuman(error), 'error'));

    getAllEggs()
      .then((groups) =>
        setEggOptions(
          groups
            .filter((group) => group.eggs.length > 0)
            .map((group) => ({
              group: group.nest.name,
              items: group.eggs.map((egg) => ({ label: egg.name, value: egg.uuid })),
            })),
        ),
      )
      .catch(() => setEggOptions([]));
  }, []);

  const save = () => {
    setSaving(true);
    updateAdminConfig({ allowedEggUuids: selectedEggs })
      .then((updated) => {
        setSelectedEggs(updated.allowedEggUuids);
        addToast('Visibility updated.', 'success');
      })
      .catch((error) => addToast(httpErrorToHuman(error), 'error'))
      .finally(() => setSaving(false));
  };

  return (
    <AdminContentContainer title='Server Properties'>
      <Stack gap='md' mt='sm'>
        <Card p='md'>
          <Text fw={700}>Server Visibility</Text>
          <Text c='dimmed' size='sm'>
            Choose which eggs show the Server Properties page. Leave empty to show it on every server.
          </Text>

          <Stack gap='sm' mt='sm'>
            <MultiSelect
              label='Allowed eggs'
              placeholder='All eggs (no restriction)'
              data={eggOptions}
              value={selectedEggs}
              onChange={setSelectedEggs}
              searchable
              clearable
            />
            <Group justify='end'>
              <Button onClick={save} loading={saving}>
                Save Visibility
              </Button>
            </Group>
          </Stack>
        </Card>
      </Stack>
    </AdminContentContainer>
  );
}
