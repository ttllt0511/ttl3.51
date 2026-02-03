
import { useState, useEffect } from 'react';
import { LocationCategory } from '../types';

export const useAutoCategory = (description: string, currentCategory: LocationCategory | string) => {
  const [suggestedCategory, setSuggestedCategory] = useState<LocationCategory | string>(currentCategory);

  useEffect(() => {
    if (!description) return;
    const desc = description.toLowerCase();
    let suggested = currentCategory;

    // Simple heuristic rules
    if (desc.includes('ticket') || desc.includes('門票') || desc.includes('遊樂園') || desc.includes('museum')) suggested = LocationCategory.SIGHTSEEING;
    else if (desc.includes('hotel') || desc.includes('bnb') || desc.includes('住宿') || desc.includes('民宿')) suggested = LocationCategory.HOTEL;
    else if (desc.includes('train') || desc.includes('bus') || desc.includes('uber') || desc.includes('taxi') || desc.includes('車') || desc.includes('pass')) suggested = LocationCategory.TRANSPORT;
    else if (desc.includes('food') || desc.includes('lunch') || desc.includes('dinner') || desc.includes('restaurant') || desc.includes('餐') || desc.includes('食') || desc.includes('cafe')) suggested = LocationCategory.FOOD;
    else if (desc.includes('shop') || desc.includes('gift') || desc.includes('買') || desc.includes('藥妝')) suggested = LocationCategory.SHOPPING;

    if (suggested !== currentCategory) {
      setSuggestedCategory(suggested);
    }
  }, [description]); // eslint-disable-line react-hooks/exhaustive-deps

  return suggestedCategory;
};
