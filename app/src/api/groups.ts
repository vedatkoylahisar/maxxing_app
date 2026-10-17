import { apiFetch } from './client';

export type Group = {
  id: string;
  name: string;
  inviteCode: string;
  memberCount: number;
  isOwner: boolean;
};

// Grupta görünen sadece özet: rutin adları ve notlar paylaşılmaz.
export type GroupMember = {
  userId: string;
  userName: string;
  isMe: boolean;
  isOwner: boolean;
  completedCount: number;
  totalCount: number;
  todayCompleted: boolean;
  streak: number;
};

export type GroupDetail = {
  id: string;
  name: string;
  inviteCode: string;
  isOwner: boolean;
  members: GroupMember[];
};

export function listGroups(token: string) {
  return apiFetch<Group[]>('/groups', { token });
}

export function createGroup(token: string, name: string) {
  return apiFetch<Group>('/groups', { method: 'POST', body: { name }, token });
}

export function joinGroup(token: string, code: string) {
  return apiFetch<Group>('/groups/join', { method: 'POST', body: { code }, token });
}

export function getGroup(token: string, id: string) {
  return apiFetch<GroupDetail>(`/groups/${id}`, { token });
}

export function leaveGroup(token: string, id: string) {
  return apiFetch<void>(`/groups/${id}/leave`, { method: 'POST', token });
}

export function resetInviteCode(token: string, id: string) {
  return apiFetch<Group>(`/groups/${id}/invite-code`, { method: 'POST', token });
}
