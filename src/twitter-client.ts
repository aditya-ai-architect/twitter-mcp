import type { Tweet, UserProfile, TrendItem } from "./types.js";

const BEARER_TOKEN =
  "AAAAAAAAAAAAAAAAAAAAANRILgAAAAAAnNwIzUejRCOuH5E6I8xnZz4puTs%3D1Zv7ttfk8LF81IUq16cHjhLTvJu4FA33AGWWjCpTnA";

const GRAPHQL_BASE = "https://x.com/i/api/graphql";

const DEFAULT_FEATURES: Record<string, boolean> = {
  rweb_tipjar_consumption_enabled: true,
  responsive_web_graphql_exclude_directive_enabled: true,
  verified_phone_label_enabled: false,
  creator_subscriptions_tweet_preview_api_enabled: true,
  responsive_web_graphql_timeline_navigation_enabled: true,
  responsive_web_graphql_skip_user_profile_image_extensions_enabled: false,
  communities_web_enable_tweet_community_results_fetch: true,
  c9s_tweet_anatomy_moderator_badge_enabled: true,
  articles_preview_enabled: true,
  responsive_web_edit_tweet_api_enabled: true,
  graphql_is_translatable_rweb_tweet_is_translatable_enabled: true,
  view_counts_everywhere_api_enabled: true,
  longform_notetweets_consumption_enabled: true,
  responsive_web_twitter_article_tweet_consumption_enabled: true,
  tweet_awards_web_tipping_enabled: false,
  creator_subscriptions_quote_tweet_preview_enabled: false,
  freedom_of_speech_not_reach_fetch_enabled: true,
  standardized_nudges_misinfo: true,
  tweet_with_visibility_results_prefer_gql_limited_actions_policy_enabled: true,
  rweb_video_timestamps_enabled: true,
  longform_notetweets_rich_text_read_enabled: true,
  longform_notetweets_inline_media_enabled: true,
  responsive_web_enhance_cards_enabled: false,
};

// Query IDs sourced from Twitter's web client JS bundles.
// These may change when Twitter deploys updates.
const QUERY_IDS: Record<string, string> = {
  HomeTimeline: "HJFjzBgCs16TqxewQOeLNg",
  HomeLatestTimeline: "DiTkXJgAKXcS_buyLnSPCA",
  UserByScreenName: "xmU6X_CKVnQ5lSrCbAmJsg",
  UserTweets: "E3opETHurmVJflFsUBVuUQ",
  TweetDetail: "nBS-WpgA6ZG0CyNHD517JQ",
  TweetResultByRestId: "DJSqGOkuGNMpfQDENkkCaA",
  SearchTimeline: "gkjsKepM6gl_HmFWoWKfgg",
  CreateTweet: "a1p9RWpkYKBjWv_I3WzS-A",
  FavoriteTweet: "lI07N6Otwv1PhnEgXILM7A",
  UnfavoriteTweet: "ZYKSe-w7KEslx3JhSIk5LA",
  CreateRetweet: "ojPdsZsimiJrUGLR1sjVsA",
  DeleteRetweet: "iQtK4dl5hBmXewYZuEOKVw",
  GenericTimelineById: "ErACkALGl_J_y6Mqefsb0g",
};

export class TwitterClient {
  private authToken: string;
  private ct0: string;

  constructor(authToken: string, ct0: string) {
    this.authToken = authToken;
    this.ct0 = ct0;
  }

  private get headers(): Record<string, string> {
    return {
      Authorization: `Bearer ${BEARER_TOKEN}`,
      "x-csrf-token": this.ct0,
      Cookie: `auth_token=${this.authToken}; ct0=${this.ct0}`,
      "Content-Type": "application/json",
      "User-Agent":
        "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/131.0.0.0 Safari/537.36",
      "x-twitter-active-user": "yes",
      "x-twitter-auth-type": "OAuth2Session",
      "x-twitter-client-language": "en",
    };
  }

  private async graphqlGet(
    queryId: string,
    operationName: string,
    variables: Record<string, unknown>,
    features: Record<string, boolean> = DEFAULT_FEATURES,
  ): Promise<unknown> {
    const params = new URLSearchParams({
      variables: JSON.stringify(variables),
      features: JSON.stringify(features),
    });

    const url = `${GRAPHQL_BASE}/${queryId}/${operationName}?${params}`;
    const res = await fetch(url, { method: "GET", headers: this.headers });

    if (!res.ok) {
      const text = await res.text();
      throw new Error(`Twitter API error ${res.status}: ${text}`);
    }

    return res.json();
  }

  private async graphqlPost(
    queryId: string,
    operationName: string,
    variables: Record<string, unknown>,
    features: Record<string, boolean> = DEFAULT_FEATURES,
  ): Promise<unknown> {
    const url = `${GRAPHQL_BASE}/${queryId}/${operationName}`;
    const res = await fetch(url, {
      method: "POST",
      headers: this.headers,
      body: JSON.stringify({ variables, features, queryId }),
    });

    if (!res.ok) {
      const text = await res.text();
      throw new Error(`Twitter API error ${res.status}: ${text}`);
    }

    return res.json();
  }

  // ── Response parsing helpers ──────────────────────────────────────

  private parseTweet(result: any): Tweet | null {
    try {
      const tweet = result?.tweet || result;
      const legacy = tweet?.legacy;
      const core = tweet?.core?.user_results?.result;
      const userLegacy = core?.legacy;

      if (!legacy || !userLegacy) return null;

      const media =
        legacy.extended_entities?.media?.map((m: any) => ({
          type: m.type,
          url: m.media_url_https || m.url,
          preview_url: m.media_url_https,
        })) ?? [];

      return {
        id: legacy.id_str || tweet.rest_id,
        text: legacy.full_text || legacy.text || "",
        author: {
          id: core.rest_id,
          username: userLegacy.screen_name,
          name: userLegacy.name,
          profile_image_url: userLegacy.profile_image_url_https,
          verified: core.is_blue_verified ?? false,
        },
        created_at: legacy.created_at,
        likes: legacy.favorite_count ?? 0,
        retweets: legacy.retweet_count ?? 0,
        replies: legacy.reply_count ?? 0,
        quotes: legacy.quote_count ?? 0,
        bookmarks: legacy.bookmark_count ?? 0,
        views: tweet.views?.count
          ? parseInt(tweet.views.count, 10)
          : undefined,
        language: legacy.lang,
        in_reply_to_tweet_id: legacy.in_reply_to_status_id_str || undefined,
        conversation_id: legacy.conversation_id_str || undefined,
        media: media.length > 0 ? media : undefined,
      };
    } catch {
      return null;
    }
  }

  private parseUser(result: any): UserProfile | null {
    try {
      const legacy = result?.legacy;
      if (!legacy) return null;

      return {
        id: result.rest_id,
        username: legacy.screen_name,
        name: legacy.name,
        description: legacy.description ?? "",
        profile_image_url: legacy.profile_image_url_https,
        profile_banner_url: legacy.profile_banner_url,
        followers_count: legacy.followers_count ?? 0,
        following_count: legacy.friends_count ?? 0,
        tweet_count: legacy.statuses_count ?? 0,
        verified: result.is_blue_verified ?? false,
        created_at: legacy.created_at,
        location: legacy.location || undefined,
        url: legacy.url || undefined,
      };
    } catch {
      return null;
    }
  }

  private extractTweetsFromTimeline(data: any): Tweet[] {
    const tweets: Tweet[] = [];
    try {
      const instructions =
        data?.data?.home?.home_timeline_urt?.instructions ??
        data?.data?.user?.result?.timeline_v2?.timeline?.instructions ??
        data?.data?.search_by_raw_query?.search_timeline?.timeline
          ?.instructions ??
        [];

      for (const instruction of instructions) {
        const entries = instruction.entries ?? [];
        for (const entry of entries) {
          const tweetResult =
            entry.content?.itemContent?.tweet_results?.result ??
            entry.content?.items?.[0]?.item?.itemContent?.tweet_results
              ?.result;

          if (tweetResult) {
            // Handle tweet with visibility results wrapper
            const innerResult =
              tweetResult.__typename === "TweetWithVisibilityResults"
                ? tweetResult.tweet
                : tweetResult;
            const parsed = this.parseTweet(innerResult);
            if (parsed) tweets.push(parsed);
          }

          // Also handle conversation threads (items array)
          if (entry.content?.items) {
            for (const item of entry.content.items) {
              const nestedResult =
                item?.item?.itemContent?.tweet_results?.result;
              if (nestedResult) {
                const innerResult =
                  nestedResult.__typename === "TweetWithVisibilityResults"
                    ? nestedResult.tweet
                    : nestedResult;
                const parsed = this.parseTweet(innerResult);
                if (parsed) tweets.push(parsed);
              }
            }
          }
        }
      }
    } catch {
      // Return whatever we collected
    }
    return tweets;
  }

  // ── Public API ────────────────────────────────────────────────────

  async getHomeTimeline(count: number = 20): Promise<Tweet[]> {
    const data = await this.graphqlGet(
      QUERY_IDS.HomeTimeline,
      "HomeTimeline",
      { count, includePromotedContent: false, latestControlAvailable: true },
    );
    return this.extractTweetsFromTimeline(data);
  }

  async getUserProfile(username: string): Promise<UserProfile | null> {
    const data = (await this.graphqlGet(
      QUERY_IDS.UserByScreenName,
      "UserByScreenName",
      {
        screen_name: username,
        withSafetyModeUserFields: true,
      },
    )) as any;

    return this.parseUser(data?.data?.user?.result);
  }

  async getUserTweets(
    username: string,
    count: number = 20,
  ): Promise<Tweet[]> {
    // First get the user ID
    const profile = await this.getUserProfile(username);
    if (!profile) throw new Error(`User @${username} not found`);

    const data = await this.graphqlGet(
      QUERY_IDS.UserTweets,
      "UserTweets",
      {
        userId: profile.id,
        count,
        includePromotedContent: false,
        withQuickPromoteEligibilityTweetFields: true,
        withVoice: true,
        withV2Timeline: true,
      },
    );
    return this.extractTweetsFromTimeline(data);
  }

  async getTweet(tweetId: string): Promise<Tweet | null> {
    const data = (await this.graphqlGet(
      QUERY_IDS.TweetResultByRestId,
      "TweetResultByRestId",
      { tweetId, withCommunity: false, includePromotedContent: false, withVoice: false },
    )) as any;

    const result = data?.data?.tweetResult?.result;
    if (!result) return null;

    const innerResult =
      result.__typename === "TweetWithVisibilityResults"
        ? result.tweet
        : result;
    return this.parseTweet(innerResult);
  }

  async searchTweets(
    query: string,
    count: number = 20,
  ): Promise<Tweet[]> {
    const data = await this.graphqlGet(
      QUERY_IDS.SearchTimeline,
      "SearchTimeline",
      {
        rawQuery: query,
        count,
        querySource: "typed_query",
        product: "Latest",
      },
    );
    return this.extractTweetsFromTimeline(data);
  }

  async getTrends(): Promise<TrendItem[]> {
    // Trends use the v1.1 REST API
    const url = "https://x.com/i/api/2/guide.json?include_page_configuration=true&initial_tab_id=trending";
    const res = await fetch(url, { method: "GET", headers: this.headers });

    if (!res.ok) {
      const text = await res.text();
      throw new Error(`Twitter API error ${res.status}: ${text}`);
    }

    const data = (await res.json()) as any;
    const trends: TrendItem[] = [];

    try {
      const timeline = data?.timeline?.instructions ?? [];
      for (const instruction of timeline) {
        const entries = instruction.addEntries?.entries ?? [];
        for (const entry of entries) {
          const items = entry.content?.timelineModule?.items ?? [];
          for (const item of items) {
            const trend = item?.item?.content?.trend;
            if (trend) {
              trends.push({
                name: trend.name,
                tweet_count: trend.trendMetadata?.metaDescription
                  ? parseInt(
                      trend.trendMetadata.metaDescription.replace(/[^0-9]/g, ""),
                      10,
                    ) || undefined
                  : undefined,
                description: trend.trendMetadata?.metaDescription,
                domain: trend.trendMetadata?.domainContext,
              });
            }
          }
        }
      }
    } catch {
      // Return whatever we parsed
    }

    return trends;
  }

  async postTweet(
    text: string,
    replyToTweetId?: string,
  ): Promise<Tweet | null> {
    const variables: Record<string, unknown> = {
      tweet_text: text,
      dark_request: false,
      media: { media_entities: [], possibly_sensitive: false },
      semantic_annotation_ids: [],
    };

    if (replyToTweetId) {
      variables.reply = {
        in_reply_to_tweet_id: replyToTweetId,
        exclude_reply_user_ids: [],
      };
    }

    const data = (await this.graphqlPost(
      QUERY_IDS.CreateTweet,
      "CreateTweet",
      variables,
    )) as any;

    const result = data?.data?.create_tweet?.tweet_results?.result;
    return result ? this.parseTweet(result) : null;
  }

  async likeTweet(tweetId: string): Promise<boolean> {
    const data = (await this.graphqlPost(
      QUERY_IDS.FavoriteTweet,
      "FavoriteTweet",
      { tweet_id: tweetId },
      {},
    )) as any;
    return data?.data?.favorite_tweet === "Done";
  }

  async unlikeTweet(tweetId: string): Promise<boolean> {
    const data = (await this.graphqlPost(
      QUERY_IDS.UnfavoriteTweet,
      "UnfavoriteTweet",
      { tweet_id: tweetId },
      {},
    )) as any;
    return data?.data?.unfavorite_tweet === "Done";
  }

  async retweet(tweetId: string): Promise<boolean> {
    const data = (await this.graphqlPost(
      QUERY_IDS.CreateRetweet,
      "CreateRetweet",
      { tweet_id: tweetId, dark_request: false },
      {},
    )) as any;
    return !!data?.data?.create_retweet?.retweet_results?.result;
  }

  async unretweet(tweetId: string): Promise<boolean> {
    const data = (await this.graphqlPost(
      QUERY_IDS.DeleteRetweet,
      "DeleteRetweet",
      { source_tweet_id: tweetId, dark_request: false },
      {},
    )) as any;
    return !!data?.data?.unretweet?.source_tweet_results?.result;
  }
}
