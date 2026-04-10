// Reusable pop-up modal for drill-down stat views
import React from 'react';
import { View, Text, TouchableOpacity, ScrollView, Modal, StyleSheet } from 'react-native';
import { Colors, Typography, Spacing, Radii } from '../theme';

interface DrillDownItem {
  id: string;
  title: string;
  subtitle?: string;
  value?: string;
  valueColor?: string;
}

interface Props {
  visible: boolean;
  title: string;
  items: DrillDownItem[];
  onClose: () => void;
  onItemPress?: (id: string) => void;
  emptyText?: string;
}

export const DrillDownModal: React.FC<Props> = ({
  visible, title, items, onClose, onItemPress, emptyText = 'No data',
}) => (
  <Modal visible={visible} transparent animationType="fade" onRequestClose={onClose}>
    <TouchableOpacity style={styles.backdrop} activeOpacity={1} onPress={onClose}>
      <TouchableOpacity style={styles.card} activeOpacity={1} onPress={() => {}}>
        {/* Header */}
        <View style={styles.header}>
          <Text style={styles.title}>{title}</Text>
          <TouchableOpacity onPress={onClose} hitSlop={{ top: 12, bottom: 12, left: 12, right: 12 }}>
            <Text style={styles.close}>✕</Text>
          </TouchableOpacity>
        </View>

        {/* Content */}
        <ScrollView style={styles.list} showsVerticalScrollIndicator={false}>
          {items.length === 0 ? (
            <Text style={styles.empty}>{emptyText}</Text>
          ) : (
            <>
              {items.slice(0, 20).map(item => (
                <TouchableOpacity
                  key={item.id}
                  style={styles.row}
                  onPress={() => onItemPress?.(item.id)}
                  activeOpacity={onItemPress ? 0.7 : 1}
                >
                  <View style={{ flex: 1 }}>
                    <Text style={styles.rowTitle}>{item.title}</Text>
                    {item.subtitle && <Text style={styles.rowSub}>{item.subtitle}</Text>}
                  </View>
                  {item.value && (
                    <Text style={[styles.rowValue, item.valueColor ? { color: item.valueColor } : {}]}>
                      {item.value}
                    </Text>
                  )}
                </TouchableOpacity>
              ))}
              {items.length > 20 && (
                <Text style={styles.viewAll}>{items.length - 20} more not shown</Text>
              )}
            </>
          )}
        </ScrollView>
      </TouchableOpacity>
    </TouchableOpacity>
  </Modal>
);

const styles = StyleSheet.create({
  backdrop: { flex: 1, backgroundColor: 'rgba(0,0,0,0.6)', justifyContent: 'center', padding: Spacing.xl },
  card: { backgroundColor: Colors.card, borderRadius: Radii.xl, maxHeight: '80%', overflow: 'hidden' },
  header: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', padding: Spacing.lg, borderBottomWidth: 0.5, borderBottomColor: Colors.border },
  title: { fontFamily: Typography.sansMed, fontSize: 18, color: Colors.ink },
  close: { fontSize: 20, color: Colors.ink2, padding: 4 },
  list: { padding: Spacing.md },
  empty: { fontFamily: Typography.sans, fontSize: 16, color: Colors.ink3, textAlign: 'center', paddingVertical: Spacing.xl },
  row: { flexDirection: 'row', alignItems: 'center', padding: 12, borderBottomWidth: 0.5, borderBottomColor: Colors.border, gap: 8 },
  rowTitle: { fontFamily: Typography.sansMed, fontSize: 16, color: Colors.ink },
  rowSub: { fontFamily: Typography.sans, fontSize: 13, color: Colors.ink2, marginTop: 2 },
  rowValue: { fontFamily: Typography.mono, fontSize: 16, color: Colors.teal },
  viewAll: { fontFamily: Typography.sans, fontSize: 14, color: Colors.ink3, textAlign: 'center', paddingVertical: Spacing.md },
});
