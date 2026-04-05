import { Clock, Eye, Heart } from "lucide-react-native";
import React from "react";
import { Image, StyleSheet, Text, TouchableOpacity, View } from "react-native";
import { Colors } from "../../constants/Colors";

export default function ArticleCard({ item, onPress }) {
  return (
    <TouchableOpacity
      activeOpacity={0.9}
      style={styles.card}
      onPress={() => onPress?.(item.slug || item.id)}
    >
      <Image
        source={{ uri: item.image }}
        style={styles.cover}
        resizeMode="cover"
      />
      <View style={styles.body}>
        <View style={styles.badge}>
          <Text style={styles.badgeText}>{item.category || "Health"}</Text>
        </View>

        <Text style={styles.title} numberOfLines={2}>
          {item.title}
        </Text>
        <Text style={styles.desc} numberOfLines={2}>
          {item.description}
        </Text>

        <View style={styles.metaRow}>
          <View style={styles.metaItem}>
            <Clock size={12} color={Colors.textSecondary} />
            <Text style={styles.metaText}>{item.readTime || "1 min read"}</Text>
          </View>
          <View style={styles.metaItem}>
            <Eye size={12} color={Colors.textSecondary} />
            <Text style={styles.metaText}>{item.views || 0}</Text>
          </View>
          <View style={styles.metaItem}>
            <Heart size={12} color={Colors.textSecondary} />
            <Text style={styles.metaText}>{item.likes || 0}</Text>
          </View>
        </View>

        <View style={styles.authorRow}>
          <Text style={styles.authorName} numberOfLines={1}>
            {item.author?.name || "NiviDoc Team"}
          </Text>
          <Text style={styles.dateText}>
            {item.createdAt
              ? new Date(item.createdAt).toLocaleDateString()
              : ""}
          </Text>
        </View>
      </View>
    </TouchableOpacity>
  );
}

const styles = StyleSheet.create({
  card: {
    width: "100%",
    borderRadius: 18,
    borderWidth: 1,
    borderColor: Colors.border,
    overflow: "hidden",
    backgroundColor: Colors.surface,
    shadowColor: Colors.black,
    shadowOffset: { width: 0, height: 6 },
    shadowOpacity: 0.08,
    shadowRadius: 12,
    elevation: 4,
  },
  cover: {
    width: "100%",
    height: 158,
    backgroundColor: Colors.lightGray,
  },
  body: {
    padding: 12,
    gap: 8,
  },
  badge: {
    alignSelf: "flex-start",
    backgroundColor: "#E0F2FE",
    borderRadius: 999,
    paddingHorizontal: 8,
    paddingVertical: 3,
  },
  badgeText: {
    color: Colors.primary,
    fontSize: 10,
    fontWeight: "700",
  },
  title: {
    fontSize: 14,
    lineHeight: 19,
    fontWeight: "800",
    color: Colors.text,
  },
  desc: {
    fontSize: 12,
    lineHeight: 17,
    color: Colors.textSecondary,
  },
  metaRow: {
    flexDirection: "row",
    gap: 10,
    alignItems: "center",
  },
  metaItem: {
    flexDirection: "row",
    alignItems: "center",
    gap: 4,
  },
  metaText: {
    fontSize: 11,
    color: Colors.textSecondary,
    fontWeight: "600",
  },
  authorRow: {
    marginTop: 2,
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    gap: 8,
  },
  authorName: {
    flex: 1,
    fontSize: 11,
    color: Colors.text,
    fontWeight: "700",
  },
  dateText: {
    fontSize: 10,
    color: Colors.textSecondary,
  },
});
