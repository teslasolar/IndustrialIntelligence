import { useState, useEffect } from 'react';
import { ChevronRight, ChevronDown, Tag, Database, Eye, Settings } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { StatusIndicator } from './StatusIndicator';

interface UnsNode {
  id: number;
  nodeId: string;
  parentNodeId: string | null;
  name: string;
  nodeType: string;
  description: string | null;
  metadata: any;
  createdAt: Date;
  updatedAt: Date;
}

interface UnsTag {
  id: number;
  tagPath: string;
  nodeId: string;
  tagName: string;
  dataType: string;
  value: string | null;
  quality: string;
  timestamp: Date;
  historize: boolean | null;
  metadata: any;
}

interface PerspectiveView {
  id: number;
  viewPath: string;
  viewName: string;
  viewType: string;
  viewDefinition: any;
  parentPath: string | null;
  isEnabled: boolean | null;
}

interface UnsTagBrowserProps {
  onSelectNode?: (node: UnsNode) => void;
  onSelectTag?: (tag: UnsTag) => void;
  onSelectView?: (view: PerspectiveView) => void;
}

export function UnsTagBrowser({ onSelectNode, onSelectTag, onSelectView }: UnsTagBrowserProps) {
  const [nodes, setNodes] = useState<UnsNode[]>([]);
  const [tags, setTags] = useState<UnsTag[]>([]);
  const [views, setViews] = useState<PerspectiveView[]>([]);
  const [expandedNodes, setExpandedNodes] = useState<Set<string>>(new Set(['Enterprise', 'Enterprise/Site1']));
  const [selectedNode, setSelectedNode] = useState<UnsNode | null>(null);
  const [activeTab, setActiveTab] = useState<'nodes' | 'tags' | 'views'>('nodes');

  const formatTimestamp = (timestamp: Date | string | null): string => {
    if (!timestamp) return '--:--:--';
    
    try {
      const dateObj = timestamp instanceof Date ? timestamp : new Date(timestamp);
      if (isNaN(dateObj.getTime())) return '--:--:--';
      
      return dateObj.toLocaleTimeString();
    } catch (error) {
      return '--:--:--';
    }
  };

  useEffect(() => {
    fetchUnsData();
  }, []);

  const fetchUnsData = async () => {
    try {
      const [nodesRes, tagsRes, viewsRes] = await Promise.all([
        fetch('/api/uns/nodes'),
        fetch('/api/uns/tags'),
        fetch('/api/perspective/views')
      ]);

      if (nodesRes.ok) {
        const nodesData = await nodesRes.json();
        setNodes(nodesData);
      }

      if (tagsRes.ok) {
        const tagsData = await tagsRes.json();
        setTags(tagsData);
      }

      if (viewsRes.ok) {
        const viewsData = await viewsRes.json();
        setViews(viewsData);
      }
    } catch (error) {
      console.error('Error fetching UNS data:', error);
    }
  };

  const buildNodeTree = (parentNodeId: string | null = null): UnsNode[] => {
    return nodes
      .filter(node => node.parentNodeId === parentNodeId)
      .sort((a, b) => a.name.localeCompare(b.name));
  };

  const getNodeTags = (nodeId: string): UnsTag[] => {
    return tags.filter(tag => tag.nodeId === nodeId);
  };

  const toggleNodeExpansion = (nodeId: string) => {
    const newExpanded = new Set(expandedNodes);
    if (newExpanded.has(nodeId)) {
      newExpanded.delete(nodeId);
    } else {
      newExpanded.add(nodeId);
    }
    setExpandedNodes(newExpanded);
  };

  const handleNodeSelect = (node: UnsNode) => {
    setSelectedNode(node);
    onSelectNode?.(node);
  };

  const getQualityColor = (quality: string) => {
    switch (quality.toLowerCase()) {
      case 'good':
        return 'text-industrial-green';
      case 'bad':
        return 'text-industrial-red';
      case 'uncertain':
        return 'text-industrial-amber';
      default:
        return 'text-gray-400';
    }
  };

  const getDataTypeIcon = (dataType: string) => {
    switch (dataType.toLowerCase()) {
      case 'boolean':
        return '🔘';
      case 'int32':
      case 'float32':
        return '🔢';
      case 'string':
        return '📝';
      case 'datetime':
        return '🕐';
      case 'json':
        return '📋';
      default:
        return '📄';
    }
  };

  const renderNodeTree = (parentNodeId: string | null = null, level = 0): JSX.Element[] => {
    const children = buildNodeTree(parentNodeId);
    
    return children.map(node => {
      const hasChildren = nodes.some(n => n.parentNodeId === node.nodeId);
      const isExpanded = expandedNodes.has(node.nodeId);
      const nodeTags = getNodeTags(node.nodeId);

      return (
        <div key={node.nodeId} className="space-y-1">
          <div
            className={`
              flex items-center space-x-2 p-2 rounded cursor-pointer transition-colors group
              ${selectedNode?.nodeId === node.nodeId ? 'bg-industrial-blue/20' : 'hover:bg-gray-700'}
              ${level > 0 ? 'ml-4 border-l border-gray-600 pl-4' : ''}
            `}
            onClick={() => handleNodeSelect(node)}
          >
            <div className="flex items-center space-x-1 flex-1">
              {hasChildren && (
                <button
                  onClick={(e) => {
                    e.stopPropagation();
                    toggleNodeExpansion(node.nodeId);
                  }}
                  className="p-0.5 hover:bg-gray-600 rounded"
                >
                  {isExpanded ? (
                    <ChevronDown className="w-3 h-3" />
                  ) : (
                    <ChevronRight className="w-3 h-3" />
                  )}
                </button>
              )}
              
              <Database className="w-4 h-4 text-industrial-blue" />
              <span className="font-mono text-sm">{node.name}</span>
              <Badge variant="outline" className="text-xs">
                {node.nodeType}
              </Badge>
            </div>
            
            <div className="flex items-center space-x-2">
              <StatusIndicator status="online" size="sm" />
              <span className="text-xs text-gray-400 font-mono">{nodeTags.length}</span>
            </div>
          </div>

          {isExpanded && hasChildren && (
            <div className="space-y-1">
              {renderNodeTree(node.nodeId, level + 1)}
            </div>
          )}

          {isExpanded && selectedNode?.nodeId === node.nodeId && nodeTags.length > 0 && (
            <div className="ml-6 space-y-1 border-l border-gray-600 pl-2">
              {nodeTags.map(tag => (
                <div
                  key={tag.tagPath}
                  className="flex items-center space-x-2 p-1 rounded hover:bg-gray-700 cursor-pointer"
                  onClick={() => onSelectTag?.(tag)}
                >
                  <Tag className="w-3 h-3 text-industrial-amber" />
                  <span className="font-mono text-xs">{tag.tagName}</span>
                  <span className="text-xs">{getDataTypeIcon(tag.dataType)}</span>
                  <span className="text-xs font-mono text-gray-300">{tag.value}</span>
                  <span className={`text-xs font-mono ${getQualityColor(tag.quality)}`}>
                    {tag.quality}
                  </span>
                </div>
              ))}
            </div>
          )}
        </div>
      );
    });
  };

  const renderTagList = () => {
    return (
      <div className="space-y-2">
        {tags.map(tag => (
          <div
            key={tag.tagPath}
            className="industrial-button p-3 rounded cursor-pointer hover:bg-gray-600 transition-colors"
            onClick={() => onSelectTag?.(tag)}
          >
            <div className="flex items-center justify-between mb-2">
              <div className="flex items-center space-x-2">
                <Tag className="w-4 h-4 text-industrial-amber" />
                <span className="font-mono text-sm font-medium">{tag.tagName}</span>
                <Badge variant="outline" className="text-xs">
                  {tag.dataType}
                </Badge>
              </div>
              <span className={`text-xs font-mono ${getQualityColor(tag.quality)}`}>
                {tag.quality}
              </span>
            </div>
            
            <div className="text-xs text-gray-400 font-mono mb-1">
              {tag.tagPath}
            </div>
            
            <div className="flex items-center justify-between">
              <span className="text-sm font-mono text-white">
                {tag.value || 'NULL'}
              </span>
              <span className="text-xs text-gray-400">
                {formatTimestamp(tag.timestamp)}
              </span>
            </div>
          </div>
        ))}
      </div>
    );
  };

  const renderViewList = () => {
    return (
      <div className="space-y-2">
        {views.map(view => (
          <div
            key={view.viewPath}
            className="industrial-button p-3 rounded cursor-pointer hover:bg-gray-600 transition-colors"
            onClick={() => onSelectView?.(view)}
          >
            <div className="flex items-center justify-between mb-2">
              <div className="flex items-center space-x-2">
                <Eye className="w-4 h-4 text-industrial-green" />
                <span className="font-mono text-sm font-medium">{view.viewName}</span>
                <Badge variant="outline" className="text-xs">
                  {view.viewType}
                </Badge>
              </div>
              <StatusIndicator 
                status={view.isEnabled ? 'online' : 'offline'} 
                size="sm" 
              />
            </div>
            
            <div className="text-xs text-gray-400 font-mono mb-2">
              {view.viewPath}
            </div>
            
            <div className="text-xs text-gray-300">
              {view.parentPath && (
                <span>Parent: {view.parentPath}</span>
              )}
            </div>
          </div>
        ))}
      </div>
    );
  };

  return (
    <div className="w-80 industrial-panel border-r border-gray-600 flex flex-col">
      {/* Header */}
      <div className="border-b border-gray-600 px-4 py-3">
        <h2 className="font-mono font-semibold text-industrial-blue">UNS TAG BROWSER</h2>
        <p className="text-xs text-gray-400 mt-1">Unified Namespace Structure</p>
      </div>

      {/* Tab Navigation */}
      <div className="border-b border-gray-700 px-4">
        <div className="flex space-x-1">
          {[
            { key: 'nodes', label: 'NODES', icon: Database },
            { key: 'tags', label: 'TAGS', icon: Tag },
            { key: 'views', label: 'VIEWS', icon: Eye }
          ].map(({ key, label, icon: Icon }) => (
            <Button
              key={key}
              variant={activeTab === key ? 'default' : 'ghost'}
              size="sm"
              className="industrial-button font-mono text-xs"
              onClick={() => setActiveTab(key as any)}
            >
              <Icon className="w-3 h-3 mr-1" />
              {label}
            </Button>
          ))}
        </div>
      </div>

      {/* Content */}
      <div className="flex-1 overflow-y-auto p-4">
        {activeTab === 'nodes' && (
          <div className="space-y-1">
            {nodes.length > 0 ? (
              renderNodeTree()
            ) : (
              <div className="text-center text-gray-400 text-sm font-mono py-8">
                <Database className="w-8 h-8 mx-auto mb-2 opacity-50" />
                No UNS nodes found
              </div>
            )}
          </div>
        )}

        {activeTab === 'tags' && (
          <div>
            {tags.length > 0 ? (
              renderTagList()
            ) : (
              <div className="text-center text-gray-400 text-sm font-mono py-8">
                <Tag className="w-8 h-8 mx-auto mb-2 opacity-50" />
                No tags found
              </div>
            )}
          </div>
        )}

        {activeTab === 'views' && (
          <div>
            {views.length > 0 ? (
              renderViewList()
            ) : (
              <div className="text-center text-gray-400 text-sm font-mono py-8">
                <Eye className="w-8 h-8 mx-auto mb-2 opacity-50" />
                No Perspective views found
              </div>
            )}
          </div>
        )}
      </div>

      {/* Footer Info */}
      <div className="border-t border-gray-600 p-4">
        <div className="text-xs font-mono space-y-1">
          <div className="flex justify-between">
            <span className="text-gray-400">NODES:</span>
            <span className="text-white">{nodes.length}</span>
          </div>
          <div className="flex justify-between">
            <span className="text-gray-400">TAGS:</span>
            <span className="text-white">{tags.length}</span>
          </div>
          <div className="flex justify-between">
            <span className="text-gray-400">VIEWS:</span>
            <span className="text-white">{views.length}</span>
          </div>
        </div>
      </div>
    </div>
  );
}