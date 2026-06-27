import { faPen } from '@fortawesome/free-solid-svg-icons';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { Center, Group, Loader, SimpleGrid, Skeleton, Stack, Text } from '@mantine/core';
import { useEffect, useMemo, useRef, useState } from 'react';
import { useNavigate } from 'react-router';
import { httpErrorToHuman } from '@/api/axios.ts';
import Button from '@/elements/Button.tsx';
import Card from '@/elements/Card.tsx';
import ServerContentContainer from '@/elements/containers/ServerContentContainer.tsx';
import Switch from '@/elements/input/Switch.tsx';
import TextInput from '@/elements/input/TextInput.tsx';
import { useServerCan } from '@/plugins/usePermissions.ts';
import { useToast } from '@/providers/ToastProvider.tsx';
import { useServerStore } from '@/stores/server.ts';
import { getProperties, saveProperties } from '../api/client.ts';
import { fetchAllowedEggs, isEggAllowed } from '../eggGate.ts';

const humanize = (key: string) => key.replace(/[-_.]/g, ' ').replace(/\b\w/g, (char) => char.toUpperCase());

export default function ServerPropertiesPage() {
  const { addToast } = useToast();
  const navigate = useNavigate();
  const server = useServerStore((state) => state.server);
  const canEdit = useServerCan('server-properties.edit');

  const [loading, setLoading] = useState(true);
  const [found, setFound] = useState(true);
  const [keys, setKeys] = useState<string[]>([]);
  const [values, setValues] = useState<Record<string, string>>({});
  const [search, setSearch] = useState('');
  const [saving, setSaving] = useState(false);
  const [allowedEggs, setAllowedEggs] = useState<string[] | null>(null);
  const dirty = useRef(false);

  useEffect(() => {
    fetchAllowedEggs()
      .then(setAllowedEggs)
      .catch(() => setAllowedEggs([]));
  }, []);

  useEffect(() => {
    if (!server?.uuid) return;
    setLoading(true);
    dirty.current = false;
    getProperties(server.uuid)
      .then((result) => {
        setFound(result.found);
        setKeys(result.properties.map((property) => property.key));
        setValues(Object.fromEntries(result.properties.map((property) => [property.key, property.value])));
      })
      .catch((error) => addToast(httpErrorToHuman(error), 'error'))
      .finally(() => setLoading(false));
  }, [server?.uuid]);

  useEffect(() => {
    if (!dirty.current || !server?.uuid) return undefined;
    const handle = window.setTimeout(() => {
      setSaving(true);
      saveProperties(server.uuid, values)
        .then(() => addToast('Saved. Restart the server to apply.', 'success'))
        .catch((error) => addToast(httpErrorToHuman(error), 'error'))
        .finally(() => setSaving(false));
    }, 900);
    return () => window.clearTimeout(handle);
  }, [values, server?.uuid]);

  const setValue = (key: string, value: string) => {
    dirty.current = true;
    setValues((current) => ({ ...current, [key]: value }));
  };

  const openManualEdit = () => {
    if (!server?.uuidShort) return;
    navigate(`/server/${server.uuidShort}/files/edit?directory=${encodeURIComponent('/')}&file=${encodeURIComponent('server.properties')}`);
  };

  const filtered = useMemo(
    () => keys.filter((key) => key.toLowerCase().includes(search.trim().toLowerCase())),
    [keys, search],
  );

  if (server?.egg?.uuid && !isEggAllowed(server.egg.uuid, allowedEggs)) {
    return (
      <ServerContentContainer title='Server Properties' hideTitleComponent>
        <Center mih={240}>
          <Text c='dimmed'>Server Properties is not available for this server.</Text>
        </Center>
      </ServerContentContainer>
    );
  }

  return (
    <ServerContentContainer title='Server Properties' hideTitleComponent>
      <Stack gap='md' mt='sm'>
        <Card p='md'>
          <Group justify='space-between' align='center' wrap='wrap' gap='md'>
            <Stack gap={2} style={{ minWidth: 0 }}>
              <Text fw={700}>server.properties</Text>
              <Text c='dimmed' size='sm'>
                Changes save automatically and apply after a restart.
              </Text>
            </Stack>
            <Group gap='sm' align='center'>
              {saving && (
                <Group gap={6} c='dimmed'>
                  <Loader size='xs' />
                  <Text size='sm'>Saving…</Text>
                </Group>
              )}
              <TextInput
                w={320}
                placeholder='Search properties...'
                value={search}
                onChange={(event) => setSearch(event.currentTarget.value)}
              />
              <Button color='blue' leftSection={<FontAwesomeIcon icon={faPen} />} onClick={openManualEdit}>
                Manual Edit
              </Button>
            </Group>
          </Group>
        </Card>

        {loading ? (
          <SimpleGrid cols={{ base: 1, md: 2, xl: 3 }} spacing='md'>
            {Array.from({ length: 12 }).map((_, index) => (
              <Card key={index} p='md'>
                <Skeleton h={12} w='50%' radius='sm' />
                <Skeleton h={32} mt='sm' radius='sm' />
              </Card>
            ))}
          </SimpleGrid>
        ) : !found ? (
          <Center mih={200}>
            <Text c='dimmed'>No server.properties found. Start the server once so it generates the file.</Text>
          </Center>
        ) : filtered.length === 0 ? (
          <Center mih={200}>
            <Text c='dimmed'>No properties match your search.</Text>
          </Center>
        ) : (
          <div style={{ columnWidth: 340, columnGap: 16 }}>
            {filtered.map((key) => {
              const value = values[key] ?? '';
              const isBoolean = value === 'true' || value === 'false';
              return (
                <div key={key} style={{ breakInside: 'avoid', marginBottom: 16 }}>
                  <Card p='md'>
                    <Text fw={600} lineClamp={1}>
                      {humanize(key)}
                    </Text>
                    {isBoolean ? (
                      <Switch
                        mt='sm'
                        checked={value === 'true'}
                        label={key}
                        disabled={!canEdit}
                        onChange={(event) => setValue(key, event.currentTarget.checked ? 'true' : 'false')}
                      />
                    ) : (
                      <TextInput
                        mt='sm'
                        label={key}
                        value={value}
                        disabled={!canEdit}
                        onChange={(event) => setValue(key, event.currentTarget.value)}
                      />
                    )}
                  </Card>
                </div>
              );
            })}
          </div>
        )}
      </Stack>
    </ServerContentContainer>
  );
}
