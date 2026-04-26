import { parseAsString, parseAsArrayOf, parseAsInteger, useQueryStates } from 'nuqs';

export function useLeadFilters() {
  return useQueryStates({
    niche: parseAsString.withDefault('all'),
    states: parseAsArrayOf(parseAsString).withDefault([]),
    cities: parseAsArrayOf(parseAsString).withDefault([]),
    metroAreas: parseAsArrayOf(parseAsString).withDefault([]),
    zipCenter: parseAsString.withDefault(''),
    zipRadius: parseAsInteger.withDefault(0),
    websiteStatus: parseAsArrayOf(parseAsString).withDefault([]),
    pipelineStatus: parseAsArrayOf(parseAsString).withDefault([]),
    minRating: parseAsInteger.withDefault(0),
    maxRating: parseAsInteger.withDefault(50), // stored as integer * 10
    minScore: parseAsInteger.withDefault(0),
    minReviews: parseAsInteger.withDefault(0),
    search: parseAsString.withDefault(''),
  });
}
