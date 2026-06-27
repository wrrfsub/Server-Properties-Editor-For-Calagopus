import { axiosInstance } from '@/api/axios.ts';
import type { AdminConfig, PropertiesResult } from '../types/index.ts';

const serverBase = (serverUuid: string) => `/api/client/servers/${serverUuid}/server-properties`;

export async function getProperties(serverUuid: string): Promise<PropertiesResult> {
  const { data } = await axiosInstance.get(`${serverBase(serverUuid)}/properties`);
  return {
    found: Boolean(data.found),
    properties: Array.isArray(data.properties) ? data.properties : [],
  };
}

export async function saveProperties(serverUuid: string, values: Record<string, string>): Promise<void> {
  await axiosInstance.put(`${serverBase(serverUuid)}/properties`, { values });
}

export async function getAdminConfig(): Promise<AdminConfig> {
  const { data } = await axiosInstance.get('/api/admin/server-properties/config');
  return data.config;
}

export async function updateAdminConfig(payload: { allowedEggUuids?: string[] }): Promise<AdminConfig> {
  const { data } = await axiosInstance.put('/api/admin/server-properties/config', payload);
  return data.config;
}
