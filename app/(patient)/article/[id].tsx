import { useLocalSearchParams, useRouter } from "expo-router";
import {
    ArrowLeft,
    BookmarkPlus,
    Clock,
    Share2
} from "lucide-react-native";
import React, { useEffect, useMemo, useState } from "react";
import {
    Dimensions,
    Image,
    ScrollView,
    Share,
    StyleSheet,
    Text,
    TouchableOpacity,
    View,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { Colors } from "../../../constants/Colors";
import { getArticles } from "../../../services/api";

const { width: W } = Dimensions.get("window");

const FULL_CONTENT: Record<string, string> = {
  a1: `Heart disease is the leading cause of death worldwide, but the good news is that most risk factors are within your control. Here are five science-backed habits that can dramatically improve your heart health:\n\n**1. Follow a Heart-Healthy Diet**\nFocus on whole grains, fresh fruits, vegetables, lean proteins and healthy fats like avocado and olive oil. Limit saturated fats, trans fats, sodium, and added sugar. The Mediterranean diet has proven repeatedly to reduce cardiac risk.\n\n**2. Exercise Regularly**\nAim for at least 150 minutes of moderate-intensity aerobic activity per week. Even brisk walking counts. Regular movement lowers blood pressure, reduces bad cholesterol, and keeps your weight in check.\n\n**3. Quit Smoking**\nSmoking is one of the biggest risk factors for heart disease. Within just one year of quitting, your risk of coronary heart disease drops by 50%. There are now many FDA-approved aids and support programs to help.\n\n**4. Manage Stress**\nChronic stress raises cortisol levels which contributes to inflammation and high blood pressure. Practice mindfulness, deep breathing, journaling, or talk to a therapist.\n\n**5. Get Regular Checkups**\nKnow your numbers — blood pressure, cholesterol, blood sugar, and BMI. Early detection through regular health checkups can prevent serious cardiac events.`,
  a2: `Stress at work has reached epidemic levels. Studies show that chronic workplace stress increases the risk of depression by 80% and heart disease by 40%. Here's how to keep it manageable:\n\n**Identify Your Stressors**\nBefore you can address work stress, you need to understand what's causing it. Is it workload? A difficult colleague? Lack of control? Recognizing patterns is the first step.\n\n**Set Clear Boundaries**\nStop checking emails after 7pm. Block focus time on your calendar. Say no to non-essential meetings. Boundaries aren't selfish — they're necessary for sustainable performance.\n\n**Use the 2-Minute Rule**\nFor any task that takes 2 minutes or less, do it immediately. This clears mental clutter and prevents the anxiety of accumulating small tasks.\n\n**Take Real Breaks**\nStep away from your desk every 90 minutes. Even a 5-minute walk resets your nervous system. Lunch at your desk is not a break.\n\n**Talk About It**\nIf stress is overwhelming, speak to a manager or HR. Mental health support programs are increasingly common, and seeking help is a sign of strength, not weakness.`,
  a3: `Sleep is not a luxury — it is a biological necessity. The National Sleep Foundation recommends 7–9 hours per night for adults, yet one in three people are chronically sleep deprived.\n\n**Why Sleep Matters**\nDuring deep sleep, your body repairs tissues, consolidates memories, and releases growth hormones. Your immune system produces infection-fighting proteins. Your brain flushes out toxins linked to Alzheimer's disease.\n\n**Signs You're Not Getting Enough**\n- Difficulty concentrating or remembering things\n- Mood swings and irritability\n- Increased appetite (especially for sugar)\n- Getting sick frequently\n\n**Tips for Better Sleep**\n1. Maintain a consistent sleep schedule — even on weekends\n2. Make your bedroom cool (65–68°F), dark, and quiet\n3. Avoid screens 60 minutes before bed — blue light suppresses melatonin\n4. Limit caffeine after 2pm\n5. Exercise regularly, but not right before bed\n\nIf you struggle with sleep despite good habits, consult a physician — conditions like sleep apnea are common and very treatable.`,
  a4: `Healthy eating doesn't have to mean expensive superfoods or organic everything. With some simple strategies, you can eat nutritiously on a tight budget.\n\n**Buy Whole Grains in Bulk**\nOats, brown rice, lentils, and dried beans are incredibly nutritious and cost mere cents per serving. A 5lb bag of oats can fuel weeks of breakfasts.\n\n**Embrace Frozen Vegetables**\nFrozen vegetables are picked at peak ripeness and flash-frozen, preserving almost all nutrients. They're cheaper than fresh, last longer, and are just as healthy.\n\n**Plan Meals Weekly**\nDeciding what you'll eat before you shop eliminates impulse purchases and reduces food waste significantly — the average family wastes $1,800 in food annually.\n\n**Cook in Batches**\nSpend 2 hours on Sunday cooking grains, roasting vegetables, and prepping proteins. Assembly becomes fast all week, and you'll be far less tempted by expensive takeout.\n\n**Use Eggs as Protein**\nAt roughly $0.25 each, eggs are one of the most nutrient-dense, affordable protein sources available. A single egg has 6g of protein, plus vitamins B12, D, and choline.`,
};

export default function ArticleDetailsScreen() {
  const router = useRouter();
  const { id } = useLocalSearchParams<{ id: string }>();
  const [articles, setArticles] = useState<any[]>([]);

  useEffect(() => {
    const load = async () => {
      const response = await getArticles();
      if (response.data) setArticles(response.data);
    };
    load();
  }, []);

  const article = useMemo(() => {
    if (!articles.length) return null;
    return (
      articles.find((a) => String(a.id || a._id) === String(id)) || articles[0]
    );
  }, [articles, id]);

  const related = useMemo(() => {
    if (!article) return [];
    const articleId = String(article.id || article._id);
    return articles
      .filter((a) => String(a.id || a._id) !== articleId)
      .slice(0, 2);
  }, [articles, article]);

  if (!article) {
    return (
      <SafeAreaView
        style={[
          styles.container,
          { alignItems: "center", justifyContent: "center" },
        ]}
      >
        <Text style={{ color: Colors.textSecondary }}>
          Article not available.
        </Text>
      </SafeAreaView>
    );
  }

  const articleId = String(article.id || article._id || "a1");
  const bodyContent =
    article.content || FULL_CONTENT[articleId] || FULL_CONTENT.a1;

  return (
    <View style={styles.container}>
      <ScrollView
        showsVerticalScrollIndicator={false}
        contentContainerStyle={styles.scroll}
      >
        {/* Hero Image */}
        <View style={{ height: 280, position: "relative" }}>
          <Image
            source={{ uri: article.image }}
            style={StyleSheet.absoluteFill}
            resizeMode="cover"
          />
          <SafeAreaView edges={["top"]} style={styles.headerBtns}>
            <TouchableOpacity
              onPress={() => router.back()}
              style={styles.iconBtn}
              hitSlop={{ top: 12, bottom: 12, left: 12, right: 12 }}
            >
              <ArrowLeft color={Colors.text} size={22} />
            </TouchableOpacity>
            <View style={{ flexDirection: "row", gap: 8 }}>
              <TouchableOpacity
                style={styles.iconBtn}
                hitSlop={{ top: 12, bottom: 12, left: 12, right: 12 }}
              >
                <BookmarkPlus color={Colors.text} size={22} />
              </TouchableOpacity>
              <TouchableOpacity
                style={styles.iconBtn}
                onPress={() => Share.share({ message: article.title })}
                hitSlop={{ top: 12, bottom: 12, left: 12, right: 12 }}
              >
                <Share2 color={Colors.text} size={22} />
              </TouchableOpacity>
            </View>
          </SafeAreaView>
        </View>

        {/* Content */}
        <View style={styles.content}>
          <View style={styles.metaRow}>
            <View style={styles.categoryBadge}>
              <Text style={styles.categoryText}>Health & Wellness</Text>
            </View>
            <View style={styles.timeRow}>
              <Clock size={12} color={Colors.textSecondary} />
              <Text style={styles.readTime}>
                {article.readTime || "5 min read"}
              </Text>
            </View>
          </View>

          <Text style={styles.title}>{article.title}</Text>
          <Text style={styles.description}>
            {article.description ||
              "Read this health update and practical guidance from verified medical experts."}
          </Text>

          {/* Author */}
          <View style={styles.authorRow}>
            <Image
              source={{
                uri: "https://images.unsplash.com/photo-1559839734-2b71ea197ec2?auto=format&fit=crop&q=80&w=100",
              }}
              style={styles.authorAvatar}
            />
            <View>
              <Text style={styles.authorName}>Dr. Sarah Jenkins</Text>
              <Text style={styles.authorTitle}>
                Cardiologist · Verified Author
              </Text>
            </View>
          </View>

          <View style={styles.divider} />

          {/* Body Content */}
          {bodyContent.split("\n\n").map((para: string, i: number) => {
            const isBold = para.startsWith("**");
            const clean = para.replace(/\*\*/g, "");
            return (
              <Text key={i} style={isBold ? styles.bodyBold : styles.bodyText}>
                {clean}
              </Text>
            );
          })}

          <View style={styles.divider} />

          {/* Related */}
          <Text style={styles.relatedTitle}>Related Articles</Text>
          {related.map((rel) => (
            <TouchableOpacity
              key={String(rel.id || rel._id)}
              style={styles.relatedCard}
              onPress={() =>
                router.replace({
                  pathname: "/(patient)/article/[id]",
                  params: { id: rel.id || rel._id },
                })
              }
              activeOpacity={0.85}
            >
              <Image source={{ uri: rel.image }} style={styles.relatedImage} />
              <View style={{ flex: 1, padding: 12 }}>
                <Text style={styles.relatedText} numberOfLines={2}>
                  {rel.title}
                </Text>
                <Text style={styles.relatedTime}>
                  {rel.readTime || "5 min read"}
                </Text>
              </View>
            </TouchableOpacity>
          ))}
        </View>
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: Colors.background },
  scroll: { paddingBottom: 40 },
  headerBtns: {
    position: "absolute",
    top: 0,
    left: 0,
    right: 0,
    flexDirection: "row",
    justifyContent: "space-between",
    paddingHorizontal: 16,
    paddingTop: 8,
  },
  iconBtn: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: Colors.surface,
    alignItems: "center",
    justifyContent: "center",
    shadowColor: Colors.black,
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 2,
  },
  content: {
    backgroundColor: Colors.surface,
    borderTopLeftRadius: 28,
    borderTopRightRadius: 28,
    marginTop: -28,
    padding: 24,
  },
  metaRow: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    marginBottom: 14,
  },
  categoryBadge: {
    backgroundColor: "#DBEAFE",
    paddingHorizontal: 12,
    paddingVertical: 5,
    borderRadius: 20,
  },
  categoryText: { fontSize: 11, fontWeight: "700", color: Colors.primary },
  timeRow: { flexDirection: "row", alignItems: "center", gap: 4 },
  readTime: { fontSize: 12, color: Colors.textSecondary },
  title: {
    fontSize: 22,
    fontWeight: "800",
    color: Colors.text,
    lineHeight: 30,
    marginBottom: 10,
  },
  description: {
    fontSize: 15,
    color: Colors.textSecondary,
    lineHeight: 24,
    marginBottom: 20,
  },
  authorRow: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: Colors.background,
    padding: 14,
    borderRadius: 14,
  },
  authorAvatar: {
    width: 44,
    height: 44,
    borderRadius: 22,
    marginRight: 12,
    backgroundColor: Colors.border,
  },
  authorName: { fontSize: 14, fontWeight: "700", color: Colors.text },
  authorTitle: { fontSize: 11, color: Colors.primary },
  divider: { height: 1, backgroundColor: Colors.border, marginVertical: 24 },
  bodyText: {
    fontSize: 15,
    color: Colors.text,
    lineHeight: 26,
    marginBottom: 16,
  },
  bodyBold: {
    fontSize: 16,
    fontWeight: "700",
    color: Colors.text,
    lineHeight: 24,
    marginBottom: 8,
  },
  relatedTitle: {
    fontSize: 18,
    fontWeight: "700",
    color: Colors.text,
    marginBottom: 16,
  },
  relatedCard: {
    flexDirection: "row",
    borderRadius: 16,
    overflow: "hidden",
    borderWidth: 1,
    borderColor: Colors.border,
    marginBottom: 12,
    backgroundColor: Colors.surface,
  },
  relatedImage: { width: 100, height: 90 },
  relatedText: {
    fontSize: 13,
    fontWeight: "600",
    color: Colors.text,
    lineHeight: 18,
  },
  relatedTime: { fontSize: 11, color: Colors.primary, marginTop: 6 },
});
