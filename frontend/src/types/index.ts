export interface AdminConfig {
  allowedEggUuids: string[];
}

export interface Property {
  key: string;
  value: string;
}

export interface PropertiesResult {
  found: boolean;
  properties: Property[];
}
