import { GET_ALL_EPISODES } from "@/constants/query-keys";
import { api } from "@/lib/api";
import { Episode, IEpisodes } from "@/types/episodes";
import { EpisodeResponse } from "@/types/miruro-api";
import { useQuery } from "react-query";

export interface IEpisodesData extends IEpisodes {
  rawResponse?: EpisodeResponse;
  availableProviders?: string[];
}

const getAllEpisodes = async (animeId: string): Promise<IEpisodesData> => {
  const res = await api.get<EpisodeResponse>(`/episodes/${animeId}`);
  const data = res.data;

  const providerNames = Object.keys(data.providers || {});

  const subEpNumbers = new Set<number>();
  const dubEpNumbers = new Set<number>();

  for (const pName of providerNames) {
    const pData = data.providers[pName]?.episodes;
    if (pData?.sub) {
      pData.sub.forEach((ep) => subEpNumbers.add(ep.number));
    }
    if (pData?.dub) {
      pData.dub.forEach((ep) => dubEpNumbers.add(ep.number));
    }
  }

  const allEpNumbersSet = new Set<number>([
    ...Array.from(subEpNumbers),
    ...Array.from(dubEpNumbers),
  ]);
  const allEpisodeNumbers = Array.from(allEpNumbersSet).sort((a, b) => a - b);

  const episodeList: Episode[] = allEpisodeNumbers.map((epNum) => {
    let epDetail: any = null;
    let fallbackId = "";

    for (const pName of providerNames) {
      const pData = data.providers[pName]?.episodes;
      const subMatch = pData?.sub?.find((e) => e.number === epNum);
      const dubMatch = pData?.dub?.find((e) => e.number === epNum);

      if (subMatch) {
        epDetail = subMatch;
        fallbackId = subMatch.id;
        break;
      }
      if (dubMatch && !epDetail) {
        epDetail = dubMatch;
        fallbackId = dubMatch.id;
      }
    }

    return {
      title: epDetail?.title || `Episode ${epNum}`,
      episodeId: fallbackId || `watch/ep-${epNum}`,
      number: epNum,
      isFiller: !!epDetail?.filler,
      hasSub: subEpNumbers.has(epNum),
      hasDub: dubEpNumbers.has(epNum),
    };
  });

  return {
    totalEpisodes: episodeList.length,
    episodes: episodeList,
    rawResponse: data,
    availableProviders: providerNames,
  };
};

export const useGetAllEpisodes = (animeId: string) => {
  return useQuery({
    queryFn: () => getAllEpisodes(animeId),
    queryKey: [GET_ALL_EPISODES, animeId],
    enabled: !!animeId,
  });
};

