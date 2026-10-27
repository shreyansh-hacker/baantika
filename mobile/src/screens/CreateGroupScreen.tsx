import React, { useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  KeyboardAvoidingView,
  Platform,
} from 'react-native';
import { useTheme } from '../theme';
import { createGroupApi } from '../api/endpoints';
import { Button, Input, Header } from '../components/common';

export function CreateGroupScreen({ navigation }: any) {
  const theme = useTheme();

  const [name, setName] = useState('');
  const [description, setDescription] = useState('');
  const [currency, setCurrency] = useState('INR');
  const [loading, setLoading] = useState(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  const handleCreateGroup = async () => {
    if (!name.trim()) {
      setErrorMessage('Group name is required');
      return;
    }

    try {
      setLoading(true);
      setErrorMessage(null);
      const newGroup = await createGroupApi({
        name: name.trim(),
        description: description.trim() || null,
        currency,
      });

      navigation.replace('GroupDetail', {
        groupId: newGroup.id,
        groupName: newGroup.name,
      });
    } catch (err: any) {
      setErrorMessage(err.message || 'Failed to create group');
    } finally {
      setLoading(false);
    }
  };

  return (
    <View style={{ flex: 1, backgroundColor: theme.colors.background }}>
      <Header title="Create New Group" onBack={() => navigation.goBack()} />

      <KeyboardAvoidingView
        behavior={Platform.OS === 'ios' ? 'padding' : undefined}
        style={{ flex: 1 }}
      >
        <ScrollView
          contentContainerStyle={styles.container}
          keyboardShouldPersistTaps="handled"
        >
          {errorMessage && (
            <View
              style={[
                styles.errorBox,
                {
                  backgroundColor: theme.colors.error[50],
                  borderColor: theme.colors.error[200],
                },
              ]}
            >
              <Text style={[styles.errorText, { color: theme.colors.error[700] }]}>
                {errorMessage}
              </Text>
            </View>
          )}

          <Input
            label="Group Name *"
            placeholder="e.g. Goa Vacation, Flat 302, Hostel Mess"
            value={name}
            onChangeText={(text) => {
              setName(text);
              setErrorMessage(null);
            }}
          />

          <Input
            label="Description (Optional)"
            placeholder="Add details about what this group is for..."
            value={description}
            onChangeText={setDescription}
            multiline
            numberOfLines={3}
            style={{ height: 80, textAlignVertical: 'top' }}
          />

          <Input
            label="Default Currency"
            value={currency}
            editable={false}
            helperText="Default currency is Indian Rupee (INR) for this group"
          />

          <Button
            title="Create Group"
            onPress={handleCreateGroup}
            loading={loading}
            style={styles.submitBtn}
          />
        </ScrollView>
      </KeyboardAvoidingView>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    padding: 20,
  },
  errorBox: {
    padding: 12,
    borderRadius: 8,
    borderWidth: 1,
    marginBottom: 16,
  },
  errorText: {
    fontSize: 13,
    fontWeight: '500',
  },
  submitBtn: {
    marginTop: 16,
  },
});
