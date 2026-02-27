import {
  faAndroid as faAndroidBrand,
  faApple as faAppleBrand,
} from '@fortawesome/free-brands-svg-icons';
import {
  faArrowPointer,
  faBell,
  faCalendarDays,
  faCircleCheck,
  faClock,
  faCopy,
  faDesktop,
  faEye,
  faPaperPlane,
  faPause,
  faPen,
  faPlay,
  faPlus,
  faTabletScreenButton,
  faTrashCan,
  faUsers,
  faXmark,
} from '@fortawesome/free-solid-svg-icons';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { useState } from 'react';
import { CampaignForm } from '../components/campaigns/CampaignForm';
import { Badge } from '../components/ui/Badge';
import { Button } from '../components/ui/Button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '../components/ui/Card';
import { api, Campaign } from '../lib/api';

type ViewMode = 'list' | 'create' | 'edit';

export function Campaigns() {
  const queryClient = useQueryClient();
  const [viewMode, setViewMode] = useState<ViewMode>('list');
  const [selectedCampaign, setSelectedCampaign] = useState<Campaign | null>(null);

  const { data: campaignsData, isLoading } = useQuery({
    queryKey: ['campaigns'],
    queryFn: async () => {
      const data = await api.getCampaigns();
      return data.campaigns || [];
    },
  });

  const { data: statsData } = useQuery({
    queryKey: ['campaign-stats'],
    queryFn: () => api.getCampaignStats(),
    refetchInterval: 30000,
  });

  const campaigns = campaignsData ?? [];

  const createMutation = useMutation({
    mutationFn: (data: Record<string, unknown>) => api.createCampaign(data as any),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['campaigns'] });
      setViewMode('list');
    },
  });

  const updateMutation = useMutation({
    mutationFn: ({ id, data }: { id: string; data: Record<string, unknown> }) =>
      api.updateCampaign(id, data as any),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['campaigns'] });
      setViewMode('list');
    },
  });

  const sendMutation = useMutation({
    mutationFn: (id: string) => api.sendCampaign(id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['campaigns'] });
    },
  });

  const pauseMutation = useMutation({
    mutationFn: (id: string) => api.pauseCampaign(id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['campaigns'] });
    },
  });

  const resumeMutation = useMutation({
    mutationFn: (id: string) => api.resumeCampaign(id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['campaigns'] });
    },
  });

  const deleteMutation = useMutation({
    mutationFn: (id: string) => api.deleteCampaign(id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['campaigns'] });
    },
  });

  const duplicateMutation = useMutation({
    mutationFn: (id: string) => api.duplicateCampaign(id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['campaigns'] });
    },
  });

  const handleSave = async (campaignData: Record<string, unknown>) => {
    if (viewMode === 'edit' && selectedCampaign) {
      await updateMutation.mutateAsync({ id: selectedCampaign.id, data: campaignData });
    } else {
      await createMutation.mutateAsync(campaignData);
    }
  };

  const handleSend = (id: string) => {
    if (confirm('Are you sure you want to send this campaign?')) {
      sendMutation.mutate(id);
    }
  };

  const handleDelete = (id: string) => {
    if (confirm('Are you sure you want to delete this campaign? This cannot be undone.')) {
      deleteMutation.mutate(id);
    }
  };

  const handleDuplicate = (id: string) => {
    duplicateMutation.mutate(id);
  };

  const handleEdit = (campaign: Campaign) => {
    setSelectedCampaign(campaign);
    setViewMode('edit');
  };

  const getStatusInfo = (status: Campaign['status']) => {
    switch (status) {
      case 'draft':
        return { label: 'Draft', variant: 'default' as const, icon: faPen };
      case 'scheduled':
        return { label: 'Scheduled', variant: 'primary' as const, icon: faClock };
      case 'sending':
        return { label: 'Sending', variant: 'warning' as const, icon: faPaperPlane };
      case 'completed':
        return { label: 'Completed', variant: 'success' as const, icon: faCircleCheck };
      case 'paused':
        return { label: 'Paused', variant: 'error' as const, icon: faPause };
      default:
        return { label: status, variant: 'default' as const, icon: faPen };
    }
  };

  const getPlatformIcon = (platforms?: string[]) => {
    if (!platforms || platforms.length === 0) return null;
    return (
      <div className="flex items-center gap-1.5 text-xs">
        {platforms.slice(0, 3).map((p) => {
          const key = p.toLowerCase();
          if (key === 'ios')
            return (
              <span key={p} className="flex items-center gap-1 text-neutral-600">
                <FontAwesomeIcon icon={faAppleBrand} className="text-xs" /> iOS
              </span>
            );
          if (key === 'android')
            return (
              <span key={p} className="flex items-center gap-1 text-success-600">
                <FontAwesomeIcon icon={faAndroidBrand} className="text-xs" /> Android
              </span>
            );
          if (key === 'desktop')
            return (
              <span key={p} className="flex items-center gap-1 text-primary-600">
                <FontAwesomeIcon icon={faDesktop} className="text-xs" /> Desktop
              </span>
            );
          if (key === 'tablet')
            return (
              <span key={p} className="flex items-center gap-1 text-accent-600">
                <FontAwesomeIcon icon={faTabletScreenButton} className="text-xs" /> Tablet
              </span>
            );
          return null;
        })}
        {platforms.length > 3 && <span className="text-neutral-500">+{platforms.length - 3}</span>}
      </div>
    );
  };

  if (isLoading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="text-center">
          <FontAwesomeIcon icon={faClock} className="text-3xl text-neutral-300 animate-spin mb-3" />
          <p className="text-neutral-500">Loading campaigns...</p>
        </div>
      </div>
    );
  }

  if (viewMode === 'create') {
    return (
      <div>
        <div className="flex items-center justify-between mb-6">
          <div className="flex items-center gap-3">
            <Button variant="ghost" size="sm" icon={faXmark} onClick={() => setViewMode('list')} />
            <h1 className="text-2xl font-bold">Create New Campaign</h1>
          </div>
        </div>
        <CampaignForm
          onSave={handleSave}
          onCancel={() => setViewMode('list')}
          isSaving={createMutation.isPending}
          mode="create"
        />
      </div>
    );
  }

  if (viewMode === 'edit' && selectedCampaign) {
    return (
      <div>
        <div className="flex items-center justify-between mb-6">
          <div className="flex items-center gap-3">
            <Button variant="ghost" size="sm" icon={faXmark} onClick={() => setViewMode('list')} />
            <h1 className="text-2xl font-bold">Edit Campaign: {selectedCampaign.name}</h1>
          </div>
        </div>
        <CampaignForm
          campaign={selectedCampaign}
          onSave={handleSave}
          onCancel={() => setViewMode('list')}
          isSaving={updateMutation.isPending}
          mode="edit"
        />
      </div>
    );
  }

  // Calculate overall stats
  const totalSent = campaigns.reduce(
    (sum: number, c: Campaign) => sum + (c as any).stats?.sent || 0,
    0
  );
  const totalDelivered = campaigns.reduce(
    (sum: number, c: Campaign) => sum + (c as any).stats?.delivered || 0,
    0
  );
  const totalOpened = campaigns.reduce(
    (sum: number, c: Campaign) => sum + (c as any).stats?.opened || 0,
    0
  );
  const totalClicked = campaigns.reduce(
    (sum: number, c: Campaign) => sum + (c as any).stats?.clicked || 0,
    0
  );
  const avgOpenRate = totalSent > 0 ? ((totalOpened / totalSent) * 100).toFixed(1) : '0.0';
  const avgClickRate = totalOpened > 0 ? ((totalClicked / totalOpened) * 100).toFixed(1) : '0.0';

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-neutral-900">Campaigns</h1>
          <p className="text-sm text-neutral-500 mt-1">
            Create and manage your push notification campaigns
          </p>
        </div>
        <Button variant="primary" size="md" icon={faPlus} onClick={() => setViewMode('create')}>
          New Campaign
        </Button>
      </div>

      {/* Stats Overview */}
      {(statsData || campaigns.length > 0) && (
        <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-4">
          <StatCard icon={faBell} label="Total Sent" value={totalSent} color="blue" />
          <StatCard icon={faCircleCheck} label="Delivered" value={totalDelivered} color="green" />
          <StatCard
            icon={faEye}
            label="Opened"
            value={totalOpened}
            color="purple"
            subtitle={`${avgOpenRate}% rate`}
          />
          <StatCard
            icon={faArrowPointer}
            label="Clicked"
            value={totalClicked}
            color="orange"
            subtitle={`${avgClickRate}% rate`}
          />
          <StatCard icon={faUsers} label="Campaigns" value={campaigns.length} color="indigo" />
          <StatCard
            icon={faPaperPlane}
            label="Active"
            value={
              campaigns.filter((c: Campaign) => c.status === 'sending' || c.status === 'scheduled')
                .length
            }
            color="cyan"
          />
        </div>
      )}

      {/* Campaigns List */}
      {campaigns.length === 0 ? (
        <Card>
          <CardContent className="py-16 text-center">
            <FontAwesomeIcon icon={faBell} className="text-5xl text-neutral-200 mb-4" />
            <h3 className="text-lg font-semibold text-neutral-900 mb-2">No campaigns yet</h3>
            <p className="text-neutral-500 mb-6">
              Create your first push notification campaign to get started
            </p>
            <Button variant="primary" size="lg" icon={faPlus} onClick={() => setViewMode('create')}>
              Create Campaign
            </Button>
          </CardContent>
        </Card>
      ) : (
        <Card>
          <CardHeader>
            <CardTitle>All Campaigns</CardTitle>
            <CardDescription>View and manage your notification campaigns</CardDescription>
          </CardHeader>
          <CardContent className="p-0">
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead className="bg-neutral-50 border-b border-neutral-200">
                  <tr>
                    <th className="px-6 py-3 text-left text-xs font-semibold text-neutral-600 uppercase tracking-wider">
                      Campaign
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-semibold text-neutral-600 uppercase tracking-wider">
                      Status
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-semibold text-neutral-600 uppercase tracking-wider">
                      Targeting
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-semibold text-neutral-600 uppercase tracking-wider">
                      Performance
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-semibold text-neutral-600 uppercase tracking-wider">
                      Created
                    </th>
                    <th className="px-6 py-3 text-right text-xs font-semibold text-neutral-600 uppercase tracking-wider">
                      Actions
                    </th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-neutral-200">
                  {campaigns.map((campaign: Campaign) => {
                    const statusInfo = getStatusInfo(campaign.status);
                    const stats = (campaign as any).stats;

                    return (
                      <tr key={campaign.id} className="hover:bg-neutral-50 transition-colors">
                        {/* Campaign Info */}
                        <td className="px-6 py-4">
                          <div>
                            <div className="font-semibold text-neutral-900">{campaign.name}</div>
                            {campaign.description && (
                              <div className="text-sm text-neutral-500 mt-0.5 line-clamp-1">
                                {campaign.description}
                              </div>
                            )}
                            <div className="text-xs text-neutral-400 mt-1">
                              {campaign.titleTemplate.substring(0, 40)}
                              {campaign.titleTemplate.length > 40 ? '...' : ''}
                            </div>
                          </div>
                        </td>

                        {/* Status */}
                        <td className="px-6 py-4">
                          <Badge variant={statusInfo.variant} icon={statusInfo.icon} size="sm">
                            {statusInfo.label}
                          </Badge>
                          {campaign.scheduledAt && campaign.status === 'scheduled' && (
                            <div className="text-xs text-neutral-500 mt-1 flex items-center gap-1">
                              <FontAwesomeIcon icon={faCalendarDays} className="text-[10px]" />
                              {new Date(campaign.scheduledAt).toLocaleDateString()}
                            </div>
                          )}
                        </td>

                        {/* Targeting */}
                        <td className="px-6 py-4">
                          {getPlatformIcon(campaign.targetSegment?.platforms)}
                        </td>

                        {/* Performance */}
                        <td className="px-6 py-4">
                          {stats ? (
                            <div className="space-y-1">
                              <div className="flex items-center gap-3 text-xs">
                                <span className="text-neutral-500">Sent:</span>
                                <span className="font-medium text-neutral-900">
                                  {stats.sent.toLocaleString()}
                                </span>
                              </div>
                              {(stats.delivered > 0 || stats.opened > 0 || stats.clicked > 0) && (
                                <div className="flex items-center gap-2">
                                  <span
                                    className={`inline-flex items-center gap-1 px-1.5 py-0.5 rounded text-[10px] font-medium ${stats.delivered > 0 ? 'bg-success-100 text-success-700' : 'bg-neutral-100 text-neutral-400'}`}
                                  >
                                    <FontAwesomeIcon icon={faCircleCheck} className="text-[8px]" />
                                    {stats.delivered}
                                  </span>
                                  <span
                                    className={`inline-flex items-center gap-1 px-1.5 py-0.5 rounded text-[10px] font-medium ${stats.opened > 0 ? 'bg-accent-100 text-accent-700' : 'bg-neutral-100 text-neutral-400'}`}
                                  >
                                    <FontAwesomeIcon icon={faEye} className="text-[8px]" />
                                    {stats.opened}
                                  </span>
                                  <span
                                    className={`inline-flex items-center gap-1 px-1.5 py-0.5 rounded text-[10px] font-medium ${stats.clicked > 0 ? 'bg-orange-100 text-orange-700' : 'bg-neutral-100 text-neutral-400'}`}
                                  >
                                    <FontAwesomeIcon icon={faArrowPointer} className="text-[8px]" />
                                    {stats.clicked}
                                  </span>
                                </div>
                              )}
                            </div>
                          ) : (
                            <span className="text-neutral-400 text-sm">-</span>
                          )}
                        </td>

                        {/* Created */}
                        <td className="px-6 py-4 text-sm text-neutral-500">
                          {new Date(campaign.createdAt).toLocaleDateString()}
                        </td>

                        {/* Actions */}
                        <td className="px-6 py-4">
                          <div className="flex items-center justify-end gap-1">
                            {campaign.status === 'draft' && (
                              <button
                                onClick={() => handleSend(campaign.id)}
                                disabled={sendMutation.isPending}
                                className="p-2 text-success-600 hover:bg-success-50 rounded transition-colors"
                                title="Send Campaign"
                              >
                                <FontAwesomeIcon icon={faPaperPlane} />
                              </button>
                            )}
                            {campaign.status === 'paused' && (
                              <button
                                onClick={() => resumeMutation.mutate(campaign.id)}
                                disabled={resumeMutation.isPending}
                                className="p-2 text-success-600 hover:bg-success-50 rounded transition-colors"
                                title="Resume Campaign"
                              >
                                <FontAwesomeIcon icon={faPlay} />
                              </button>
                            )}
                            {(campaign.status === 'sending' || campaign.status === 'scheduled') && (
                              <button
                                onClick={() => pauseMutation.mutate(campaign.id)}
                                disabled={pauseMutation.isPending}
                                className="p-2 text-orange-600 hover:bg-orange-50 rounded transition-colors"
                                title="Pause Campaign"
                              >
                                <FontAwesomeIcon icon={faPause} />
                              </button>
                            )}
                            <button
                              onClick={() => handleEdit(campaign)}
                              className="p-2 text-primary-600 hover:bg-primary-50 rounded transition-colors"
                              title="Edit Campaign"
                            >
                              <FontAwesomeIcon icon={faPen} />
                            </button>
                            <button
                              onClick={() => handleDuplicate(campaign.id)}
                              disabled={duplicateMutation.isPending}
                              className="p-2 text-neutral-600 hover:bg-neutral-100 rounded transition-colors"
                              title="Duplicate Campaign"
                            >
                              <FontAwesomeIcon icon={faCopy} />
                            </button>
                            <button
                              onClick={() => handleDelete(campaign.id)}
                              disabled={deleteMutation.isPending || campaign.status === 'sending'}
                              className="p-2 text-error-600 hover:bg-error-50 rounded transition-colors disabled:opacity-40 disabled:cursor-not-allowed"
                              title="Delete Campaign"
                            >
                              <FontAwesomeIcon icon={faTrashCan} />
                            </button>
                          </div>
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  );
}

interface StatCardProps {
  icon: any;
  label: string;
  value: number;
  color: 'blue' | 'green' | 'purple' | 'orange' | 'indigo' | 'cyan';
  subtitle?: string;
}

function StatCard({ icon, label, value, color, subtitle }: StatCardProps) {
  const colors = {
    blue: 'text-primary-600 bg-primary-50',
    green: 'text-success-600 bg-success-50',
    purple: 'text-accent-600 bg-accent-50',
    orange: 'text-orange-600 bg-orange-50',
    indigo: 'text-indigo-600 bg-indigo-50',
    cyan: 'text-cyan-600 bg-cyan-50',
  };

  return (
    <Card>
      <CardContent className="p-4">
        <div className="flex items-center gap-2 text-neutral-500 text-xs font-medium uppercase tracking-wide">
          <div className={`p-1.5 rounded ${colors[color]}`}>
            <FontAwesomeIcon icon={icon} className="text-xs" />
          </div>
          {label}
        </div>
        <div className="text-xl font-bold text-neutral-900 mt-2">{value}</div>
        {subtitle && <div className="text-xs text-neutral-500 mt-1">{subtitle}</div>}
      </CardContent>
    </Card>
  );
}
