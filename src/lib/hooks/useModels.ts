'use client';

import { useState, useEffect } from 'react';
import type { ModelInfo, ModelsResponse } from '@/app/api/models/route';

export type { ModelInfo };

type Category = keyof ModelsResponse;

export function useModels(category: Category) {
  const [models, setModels] = useState<ModelInfo[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetch('/api/models')
      .then((r) => r.json())
      .then((data: ModelsResponse) => setModels(data[category] ?? []))
      .catch(() => setModels([]))
      .finally(() => setLoading(false));
  }, [category]);

  return { models, loading };
}
