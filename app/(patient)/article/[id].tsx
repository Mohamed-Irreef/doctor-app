import { useLocalSearchParams, useRouter } from "expo-router";
import {
    ArrowLeft,
    Bookmark,
    Clock,
    Eye,
    Heart,
    Share2,
    Star,
} from "lucide-react-native";
import React, { useCallback, useEffect, useMemo, useState } from "react";
import {
    Image,
    ScrollView,
    Share,
    StatusBar,
    StyleSheet,
    Text,
    TextInput,
    TouchableOpacity,
    View,
} from "react-native";
import Markdown from "react-native-markdown-display";
import { SafeAreaView } from "react-native-safe-area-context";
import { Colors } from "../../../constants/Colors";
import {
    addArticleReview,
    getArticleBySlug,
    getArticleLikeStatus,
    getArticleReviews,
    toggleArticleLike,
} from "../../../services/api";

function formatDisplayDate(value?: string) {
  if (!value) return "";
  return new Date(value).toLocaleDateString("en-US", {
    month: "short",
    day: "2-digit",
    year: "numeric",
  });
}

function normalizeMarkdownContent(content = "") {
  return String(content)
    .replace(/\r\n?/g, "\n")
    .replace(/<br\s*\/?>(\s*)/gi, "\n")
    .replace(/<\/(p|h1|h2|h3|h4|h5|h6|li|blockquote)>/gi, "\n")
    .replace(/<[^>]*>/g, "")
    .split("\n")
    .map((line) => line.replace(/^(#{1,6})\s*#+\s*/, "$1 "))
    .filter((line) => !/^\s*--\s*$/.test(line))
    .join("\n")
    .replace(/\n{3,}/g, "\n\n")
    .trim();
}

export default function ArticleDetailsScreen() {
  const router = useRouter();
  const { id } = useLocalSearchParams<{ id: string }>();
  const slug = String(id || "");

  const [article, setArticle] = useState<any | null>(null);
  const [related, setRelated] = useState<any[]>([]);
  const [reviews, setReviews] = useState<any[]>([]);
  const [summary, setSummary] = useState({ averageRating: 0, totalReviews: 0 });
  const [reviewPage, setReviewPage] = useState(1);
  const [reviewPages, setReviewPages] = useState(1);
  const [sortBy, setSortBy] = useState<"latest" | "highest">("latest");
  const [myRating, setMyRating] = useState(0);
  const [comment, setComment] = useState("");
  const [submittingReview, setSubmittingReview] = useState(false);

  const [liked, setLiked] = useState(false);
  const [bookmarked, setBookmarked] = useState(false);

  const contentMarkdown = useMemo(
    () => normalizeMarkdownContent(article?.content || ""),
    [article?.content],
  );
  const markdownSource = contentMarkdown || "Content will be available soon.";

  const loadArticle = useCallback(async () => {
    if (!slug) return;
    const res = await getArticleBySlug(slug);
    if (res.data?.article) {
      setArticle(res.data.article);
      setRelated(Array.isArray(res.data.related) ? res.data.related : []);
    }
  }, [slug]);

  const loadReviews = useCallback(
    async (page = 1, append = false) => {
      if (!article?._id) return;
      const res = await getArticleReviews(article._id, {
        page,
        limit: 6,
        sortBy,
      });
      if (!res.data) return;

      const items = res.data.items || [];
      setReviews((prev) => (append ? [...prev, ...items] : items));
      setSummary(
        res.data.summary || {
          averageRating: 0,
          totalReviews: 0,
        },
      );
      setReviewPage(res.data.pagination?.page || page);
      setReviewPages(res.data.pagination?.pages || 1);
    },
    [article?._id, sortBy],
  );

  useEffect(() => {
    loadArticle();
  }, [loadArticle]);

  useEffect(() => {
    if (!article?._id) return;
    loadReviews(1, false);
  }, [article?._id, sortBy, loadReviews]);

  useEffect(() => {
    const loadLikeState = async () => {
      if (!article?._id) return;
      const response = await getArticleLikeStatus(article._id);
      if (!response.data) return;
      setLiked(Boolean(response.data.liked));
      setArticle((prev: any) =>
        prev
          ? {
              ...prev,
              likes: Number(response.data.likesCount || 0),
            }
          : prev,
      );
    };
    loadLikeState();
  }, [article?._id]);

  const handleSubmitReview = async () => {
    if (!article?._id || !myRating || !comment.trim()) return;
    setSubmittingReview(true);
    const res = await addArticleReview(article._id, {
      rating: myRating,
      comment: comment.trim(),
    });
    setSubmittingReview(false);

    if (res.status === "success") {
      setMyRating(0);
      setComment("");
      await loadReviews(1, false);
    }
  };

  if (!article) {
    return (
      <SafeAreaView style={styles.container} edges={["top"]}>
        <View style={styles.centerState}>
          <Text style={styles.muted}>Loading article...</Text>
        </View>
      </SafeAreaView>
    );
  }

  return (
    <View style={styles.container}>
      <StatusBar barStyle="light-content" backgroundColor={Colors.primary} />
      <ScrollView
        showsVerticalScrollIndicator={false}
        contentContainerStyle={styles.scroll}
      >
        <View style={styles.heroWrap}>
          {article.coverImage ? (
            <Image
              source={{ uri: article.coverImage }}
              style={styles.heroImage}
              resizeMode="cover"
            />
          ) : (
            <View style={styles.heroFallback} />
          )}

          <SafeAreaView edges={["top"]} style={styles.headerBtns}>
            <TouchableOpacity
              onPress={() => router.back()}
              style={styles.iconBtn}
            >
              <ArrowLeft color={Colors.text} size={20} />
            </TouchableOpacity>
            <View style={styles.headerRightBtns}>
              <TouchableOpacity
                style={styles.iconBtn}
                onPress={() => setBookmarked((v) => !v)}
              >
                <Bookmark
                  color={bookmarked ? Colors.primary : Colors.text}
                  size={19}
                  fill={bookmarked ? Colors.primary : "none"}
                />
              </TouchableOpacity>
              <TouchableOpacity
                style={styles.iconBtn}
                onPress={() =>
                  Share.share({
                    message: `${article.title}\n\n${article.slug}`,
                  })
                }
              >
                <Share2 color={Colors.text} size={19} />
              </TouchableOpacity>
            </View>
          </SafeAreaView>
        </View>

        <View style={styles.contentWrap}>
          <Text style={styles.title}>{article.title}</Text>

          <View style={styles.authorRow}>
            {article.author?.avatar ? (
              <Image
                source={{ uri: article.author?.avatar }}
                style={styles.authorAvatar}
              />
            ) : (
              <View style={styles.authorAvatarFallback}>
                <Text style={styles.authorAvatarFallbackText}>
                  {(article.author?.name || "N").charAt(0).toUpperCase()}
                </Text>
              </View>
            )}
            <View style={{ flex: 1 }}>
              <Text style={styles.authorName}>
                {article.author?.name || "NiviDoc Editorial"}
              </Text>
              <Text style={styles.authorSub}>
                {article.author?.role || "Admin"}
                {article.createdAt
                  ? ` • ${formatDisplayDate(article.createdAt)}`
                  : ""}
              </Text>
            </View>
            <View style={styles.metaMiniRow}>
              <Clock size={12} color={Colors.textSecondary} />
              <Text style={styles.metaMiniText}>
                {article.readTime || 1} min read
              </Text>
            </View>
            <View style={styles.metaMiniRow}>
              <Eye size={12} color={Colors.textSecondary} />
              <Text style={styles.metaMiniText}>{article.views || 0}</Text>
            </View>
          </View>

          <View style={styles.actionRow}>
            <TouchableOpacity
              style={styles.actionBtn}
              onPress={async () => {
                if (!article?._id) return;
                const response = await toggleArticleLike(article._id);
                if (!response.data) return;
                setLiked(Boolean(response.data.liked));
                setArticle((prev: any) =>
                  prev
                    ? {
                        ...prev,
                        likes: Number(response.data.likesCount || 0),
                      }
                    : prev,
                );
              }}
            >
              <Heart
                color={liked ? Colors.error : Colors.textSecondary}
                size={16}
                fill={liked ? Colors.error : "none"}
              />
              <Text style={styles.actionText}>
                {liked ? "❤️ Liked" : "❤️ Like"} ({article.likes || 0})
              </Text>
            </TouchableOpacity>
            <TouchableOpacity
              style={styles.actionBtn}
              onPress={() => Share.share({ message: article.title })}
            >
              <Share2 color={Colors.textSecondary} size={16} />
              <Text style={styles.actionText}>🔗 Share</Text>
            </TouchableOpacity>
          </View>

          <View style={styles.articleCard}>
            <Markdown style={markdownStyles}>{markdownSource}</Markdown>
          </View>

          <View style={styles.section}>
            <View style={styles.reviewHead}>
              <Text style={styles.sectionTitle}>Reviews</Text>
              <Text style={styles.reviewSummary}>
                {summary.averageRating || 0} / 5 ({summary.totalReviews || 0})
              </Text>
            </View>

            <View style={styles.sortRow}>
              <TouchableOpacity
                style={[
                  styles.sortBtn,
                  sortBy === "latest" && styles.sortBtnActive,
                ]}
                onPress={() => setSortBy("latest")}
              >
                <Text
                  style={[
                    styles.sortText,
                    sortBy === "latest" && styles.sortTextActive,
                  ]}
                >
                  Latest
                </Text>
              </TouchableOpacity>
              <TouchableOpacity
                style={[
                  styles.sortBtn,
                  sortBy === "highest" && styles.sortBtnActive,
                ]}
                onPress={() => setSortBy("highest")}
              >
                <Text
                  style={[
                    styles.sortText,
                    sortBy === "highest" && styles.sortTextActive,
                  ]}
                >
                  Highest
                </Text>
              </TouchableOpacity>
            </View>

            <View style={styles.reviewInputWrap}>
              <Text style={styles.inputLabel}>Rate this article</Text>
              <View style={styles.starRow}>
                {[1, 2, 3, 4, 5].map((star) => (
                  <TouchableOpacity
                    key={star}
                    onPress={() => setMyRating(star)}
                  >
                    <Star
                      size={28}
                      color="#F59E0B"
                      fill={star <= myRating ? "#F59E0B" : "none"}
                    />
                  </TouchableOpacity>
                ))}
              </View>
              <TextInput
                value={comment}
                onChangeText={setComment}
                placeholder="Share your experience reading this article..."
                placeholderTextColor={Colors.textSecondary}
                multiline
                style={styles.commentInput}
              />
              <TouchableOpacity
                style={[
                  styles.submitBtn,
                  (!myRating || !comment.trim()) && styles.submitBtnDisabled,
                ]}
                onPress={handleSubmitReview}
                disabled={!myRating || !comment.trim() || submittingReview}
              >
                <Text style={styles.submitText}>
                  {submittingReview ? "Submitting..." : "Submit Review"}
                </Text>
              </TouchableOpacity>
            </View>

            <View style={{ gap: 10, marginTop: 8 }}>
              {reviews.map((review) => (
                <View key={String(review._id)} style={styles.reviewCard}>
                  <View style={styles.reviewCardHead}>
                    <View style={styles.reviewUserWrap}>
                      <Image
                        source={{ uri: review.userId?.image || "" }}
                        style={styles.reviewAvatar}
                      />
                      <Text style={styles.reviewUser}>
                        {review.userId?.name || "Patient"}
                      </Text>
                    </View>
                    <Text style={styles.reviewDate}>
                      {formatDisplayDate(review.createdAt)}
                    </Text>
                  </View>
                  <Text style={styles.reviewStars}>
                    {"★".repeat(review.rating)}
                  </Text>
                  <Text style={styles.reviewComment}>{review.comment}</Text>
                </View>
              ))}
            </View>

            {reviewPage < reviewPages ? (
              <TouchableOpacity
                style={styles.moreBtn}
                onPress={() => loadReviews(reviewPage + 1, true)}
              >
                <Text style={styles.moreText}>Load More Reviews</Text>
              </TouchableOpacity>
            ) : null}
          </View>

          <View style={styles.section}>
            <Text style={styles.sectionTitle}>Related Articles</Text>
            <View style={{ gap: 10 }}>
              {related.slice(0, 5).map((item) => (
                <TouchableOpacity
                  key={String(item._id)}
                  style={styles.relatedCard}
                  onPress={() =>
                    router.replace({
                      pathname: "/(patient)/article/[id]",
                      params: { id: item.slug },
                    })
                  }
                >
                  <Image
                    source={{ uri: item.coverImage }}
                    style={styles.relatedImage}
                  />
                  <View style={{ flex: 1 }}>
                    <Text style={styles.relatedTitle} numberOfLines={2}>
                      {item.title}
                    </Text>
                    <Text style={styles.relatedMeta}>
                      {item.readTime || 1} min read
                    </Text>
                  </View>
                </TouchableOpacity>
              ))}
            </View>
          </View>
        </View>
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: Colors.background },
  progressWrap: {
    position: "absolute",
    top: 0,
    left: 0,
    right: 0,
    zIndex: 50,
  },
  progressTrack: {
    height: 3,
    backgroundColor: "rgba(15, 23, 42, 0.12)",
  },
  progressFill: {
    height: "100%",
    backgroundColor: Colors.primary,
  },
  centerState: { flex: 1, alignItems: "center", justifyContent: "center" },
  muted: { color: Colors.textSecondary, fontSize: 14 },
  scroll: { paddingBottom: 32 },
  heroWrap: { height: 260 },
  heroImage: {
    width: "100%",
    height: "100%",
    backgroundColor: Colors.lightGray,
  },
  heroFallback: {
    width: "100%",
    height: "100%",
    backgroundColor: "#DDE5EF",
  },
  headerBtns: {
    position: "absolute",
    top: 0,
    left: 0,
    right: 0,
    flexDirection: "row",
    justifyContent: "space-between",
    paddingHorizontal: 16,
    paddingTop: 6,
  },
  headerRightBtns: { flexDirection: "row", gap: 8 },
  iconBtn: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: Colors.surface,
    alignItems: "center",
    justifyContent: "center",
    borderWidth: 1,
    borderColor: Colors.border,
  },
  contentWrap: {
    marginTop: -18,
    borderTopLeftRadius: 22,
    borderTopRightRadius: 22,
    backgroundColor: Colors.surface,
    padding: 16,
    gap: 14,
  },
  title: {
    fontSize: 24,
    lineHeight: 32,
    fontWeight: "900",
    color: Colors.text,
  },
  authorRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
    borderWidth: 1,
    borderColor: Colors.border,
    borderRadius: 14,
    padding: 10,
    backgroundColor: Colors.background,
  },
  authorAvatar: {
    width: 36,
    height: 36,
    borderRadius: 18,
    backgroundColor: Colors.border,
  },
  authorAvatarFallback: {
    width: 36,
    height: 36,
    borderRadius: 18,
    alignItems: "center",
    justifyContent: "center",
    backgroundColor: "#E2E8F0",
  },
  authorAvatarFallbackText: {
    fontSize: 13,
    fontWeight: "800",
    color: "#0F172A",
  },
  authorName: { fontSize: 13, fontWeight: "700", color: Colors.text },
  authorSub: { fontSize: 11, color: Colors.textSecondary },
  metaMiniRow: { flexDirection: "row", alignItems: "center", gap: 4 },
  metaMiniText: {
    fontSize: 11,
    color: Colors.textSecondary,
    fontWeight: "600",
  },
  actionRow: { flexDirection: "row", gap: 10 },
  actionBtn: {
    flexDirection: "row",
    gap: 6,
    alignItems: "center",
    borderRadius: 10,
    borderWidth: 1,
    borderColor: Colors.border,
    paddingHorizontal: 12,
    paddingVertical: 8,
    backgroundColor: Colors.background,
  },
  actionText: { fontSize: 12, color: Colors.textSecondary, fontWeight: "700" },
  articleCard: {
    borderRadius: 14,
    borderWidth: 1,
    borderColor: Colors.border,
    backgroundColor: Colors.surface,
    paddingHorizontal: 16,
    paddingVertical: 14,
    shadowColor: "#0F172A",
    shadowOpacity: 0.06,
    shadowRadius: 12,
    shadowOffset: { width: 0, height: 4 },
    elevation: 2,
  },
  section: {
    borderRadius: 16,
    borderWidth: 1,
    borderColor: Colors.border,
    padding: 14,
    backgroundColor: Colors.surface,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: "800",
    color: Colors.text,
    marginBottom: 10,
  },
  reviewHead: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
  },
  reviewSummary: { fontSize: 13, color: Colors.primary, fontWeight: "700" },
  sortRow: { flexDirection: "row", gap: 8, marginBottom: 10 },
  sortBtn: {
    borderWidth: 1,
    borderColor: Colors.border,
    paddingHorizontal: 10,
    paddingVertical: 6,
    borderRadius: 999,
  },
  sortBtnActive: { borderColor: Colors.primary, backgroundColor: "#DBEAFE" },
  sortText: { fontSize: 12, color: Colors.textSecondary, fontWeight: "600" },
  sortTextActive: { color: Colors.primary, fontWeight: "700" },
  reviewInputWrap: {
    borderWidth: 1,
    borderColor: Colors.border,
    borderRadius: 12,
    padding: 10,
    marginBottom: 10,
  },
  inputLabel: {
    fontSize: 13,
    fontWeight: "700",
    color: Colors.text,
    marginBottom: 6,
  },
  starRow: { flexDirection: "row", gap: 8, marginBottom: 8 },
  commentInput: {
    minHeight: 96,
    borderWidth: 1,
    borderColor: Colors.border,
    borderRadius: 10,
    padding: 10,
    textAlignVertical: "top",
    color: Colors.text,
    fontSize: 13,
    marginBottom: 8,
  },
  submitBtn: {
    backgroundColor: Colors.primary,
    borderRadius: 10,
    alignItems: "center",
    paddingVertical: 10,
  },
  submitBtnDisabled: { opacity: 0.5 },
  submitText: { color: Colors.surface, fontSize: 13, fontWeight: "700" },
  reviewCard: {
    borderWidth: 1,
    borderColor: Colors.border,
    borderRadius: 10,
    padding: 10,
    backgroundColor: Colors.background,
  },
  reviewCardHead: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: 6,
  },
  reviewUserWrap: {
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
  },
  reviewAvatar: {
    width: 26,
    height: 26,
    borderRadius: 13,
    backgroundColor: Colors.border,
  },
  reviewUser: { fontSize: 13, fontWeight: "700", color: Colors.text },
  reviewDate: { fontSize: 11, color: Colors.textSecondary },
  reviewStars: { color: "#D97706", fontSize: 12, marginBottom: 4 },
  reviewComment: { fontSize: 13, lineHeight: 19, color: Colors.textSecondary },
  moreBtn: {
    marginTop: 10,
    borderWidth: 1,
    borderColor: Colors.border,
    borderRadius: 10,
    alignItems: "center",
    paddingVertical: 10,
  },
  moreText: { fontSize: 12, fontWeight: "700", color: Colors.primary },
  relatedCard: {
    flexDirection: "row",
    gap: 10,
    borderWidth: 1,
    borderColor: Colors.border,
    borderRadius: 12,
    padding: 8,
    backgroundColor: Colors.background,
  },
  relatedImage: {
    width: 72,
    height: 72,
    borderRadius: 10,
    backgroundColor: Colors.lightGray,
  },
  relatedTitle: {
    fontSize: 13,
    lineHeight: 18,
    color: Colors.text,
    fontWeight: "700",
  },
  relatedMeta: { marginTop: 6, fontSize: 11, color: Colors.textSecondary },
});

const markdownStyles = StyleSheet.create({
  body: {
    color: Colors.text,
    fontSize: 15,
    lineHeight: 24,
  },
  paragraph: {
    marginTop: 0,
    marginBottom: 14,
    color: Colors.text,
    fontSize: 15,
    lineHeight: 24,
  },
  heading1: {
    fontSize: 24,
    lineHeight: 32,
    fontWeight: "800",
    color: Colors.text,
    marginTop: 10,
    marginBottom: 12,
  },
  heading2: {
    fontSize: 19,
    lineHeight: 27,
    fontWeight: "700",
    color: Colors.primary,
    marginTop: 12,
    marginBottom: 10,
  },
  heading3: {
    fontSize: 17,
    lineHeight: 25,
    fontWeight: "700",
    color: Colors.text,
    marginTop: 10,
    marginBottom: 8,
  },
  bullet_list: {
    marginTop: 2,
    marginBottom: 10,
  },
  ordered_list: {
    marginTop: 2,
    marginBottom: 10,
  },
  list_item: {
    marginBottom: 7,
    color: Colors.text,
    lineHeight: 23,
  },
  hr: {
    backgroundColor: "#E2E8F0",
    height: 1,
    marginTop: 10,
    marginBottom: 14,
  },
  strong: {
    fontWeight: "700",
    color: Colors.text,
  },
  em: {
    fontStyle: "italic",
    color: Colors.text,
  },
  link: {
    color: Colors.primary,
    textDecorationLine: "underline",
  },
  blockquote: {
    borderLeftWidth: 3,
    borderLeftColor: "#93C5FD",
    paddingLeft: 12,
    marginVertical: 8,
  },
});
