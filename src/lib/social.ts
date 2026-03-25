import { supabase } from "@/integrations/supabase/client";

export async function followUser(followerId: string, followingId: string) {
  const { error } = await supabase.from("followers").insert({
    follower_id: followerId,
    following_id: followingId,
  });
  if (!error) {
    await supabase.from("activity_log").insert({
      user_id: followerId,
      action: "followed_user",
    });
  }
  return { error };
}

export async function unfollowUser(followerId: string, followingId: string) {
  const { error } = await supabase
    .from("followers")
    .delete()
    .eq("follower_id", followerId)
    .eq("following_id", followingId);
  return { error };
}

export async function isFollowing(followerId: string, followingId: string) {
  const { data } = await supabase
    .from("followers")
    .select("id")
    .eq("follower_id", followerId)
    .eq("following_id", followingId)
    .maybeSingle();
  return !!data;
}

export async function getFollowerCount(userId: string) {
  const { count } = await supabase
    .from("followers")
    .select("*", { count: "exact", head: true })
    .eq("following_id", userId);
  return count || 0;
}

export async function getFollowingCount(userId: string) {
  const { count } = await supabase
    .from("followers")
    .select("*", { count: "exact", head: true })
    .eq("follower_id", userId);
  return count || 0;
}

export async function getActivityFeed(userId: string, limit = 20) {
  // Get users this person follows
  const { data: following } = await supabase
    .from("followers")
    .select("following_id")
    .eq("follower_id", userId);

  if (!following || following.length === 0) return [];

  const ids = following.map((f) => f.following_id);
  const { data } = await supabase
    .from("activity_log")
    .select("*")
    .in("user_id", ids)
    .order("created_at", { ascending: false })
    .limit(limit);

  return data || [];
}

export async function logActivity(
  userId: string,
  action: string,
  animeId?: number,
  animeTitle?: string,
  animeImage?: string
) {
  await supabase.from("activity_log").insert({
    user_id: userId,
    action,
    anime_id: animeId,
    anime_title: animeTitle,
    anime_image: animeImage,
  });
}
