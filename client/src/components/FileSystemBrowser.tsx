import { useState, useEffect } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Folder, File, Search, RefreshCw } from "lucide-react";

interface FilePathItem {
  id: string;
  name: string;
  path: string;
  type: 'file' | 'directory';
  size: number;
  modified: Date;
  checksum?: string;
  depth: number;
  extension?: string;
  permissions: string;
  isHidden: boolean;
}

interface DirectoryStructure {
  path: string;
  name: string;
  files: FilePathItem[];
  directories: FilePathItem[];
  totalSize: number;
  totalFiles: number;
  lastModified: Date;
}

export function FileSystemBrowser() {
  const [currentPath, setCurrentPath] = useState(".");
  const [structure, setStructure] = useState<DirectoryStructure | null>(null);
  const [searchPattern, setSearchPattern] = useState("");
  const [searchResults, setSearchResults] = useState<FilePathItem[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const scanDirectory = async (path: string) => {
    setLoading(true);
    setError(null);
    
    try {
      // Direct file system access through local API
      const response = await fetch(`/api/filesystem/scan/${encodeURIComponent(path)}`);
      
      if (!response.ok) {
        throw new Error(`Failed to scan directory: ${response.statusText}`);
      }
      
      const data = await response.json();
      setStructure(data);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Unknown error occurred');
      console.error('Directory scan failed:', err);
    } finally {
      setLoading(false);
    }
  };

  const searchFiles = async () => {
    if (!searchPattern.trim()) return;
    
    setLoading(true);
    try {
      const response = await fetch(
        `/api/filesystem/search?pattern=${encodeURIComponent(searchPattern)}&path=${encodeURIComponent(currentPath)}`
      );
      
      if (!response.ok) {
        throw new Error(`Search failed: ${response.statusText}`);
      }
      
      const results = await response.json();
      setSearchResults(results);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Search failed');
    } finally {
      setLoading(false);
    }
  };

  const navigateToDirectory = (dirPath: string) => {
    setCurrentPath(dirPath);
    setSearchResults([]);
  };

  const formatFileSize = (bytes: number): string => {
    if (bytes === 0) return '0 B';
    const k = 1024;
    const sizes = ['B', 'KB', 'MB', 'GB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
  };

  const formatDate = (date: string | Date): string => {
    return new Date(date).toLocaleString();
  };

  useEffect(() => {
    scanDirectory(currentPath);
  }, [currentPath]);

  return (
    <div className="space-y-6">
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Folder className="h-5 w-5" />
            Local File System Browser
          </CardTitle>
          <div className="text-sm text-muted-foreground">
            Authentic file system operations at lowest level
          </div>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            {/* Navigation */}
            <div className="flex items-center gap-2">
              <Input
                value={currentPath}
                onChange={(e) => setCurrentPath(e.target.value)}
                placeholder="Enter directory path..."
                className="flex-1"
              />
              <Button 
                onClick={() => scanDirectory(currentPath)}
                disabled={loading}
                size="sm"
              >
                <RefreshCw className={`h-4 w-4 ${loading ? 'animate-spin' : ''}`} />
              </Button>
            </div>

            {/* Search */}
            <div className="flex items-center gap-2">
              <Input
                value={searchPattern}
                onChange={(e) => setSearchPattern(e.target.value)}
                placeholder="Search files and directories..."
                className="flex-1"
                onKeyPress={(e) => e.key === 'Enter' && searchFiles()}
              />
              <Button onClick={searchFiles} disabled={loading} size="sm">
                <Search className="h-4 w-4" />
              </Button>
            </div>

            {error && (
              <div className="p-3 bg-red-50 border border-red-200 rounded-md text-red-700 text-sm">
                {error}
              </div>
            )}

            {/* Directory Info */}
            {structure && (
              <div className="grid grid-cols-4 gap-4 p-4 bg-gray-50 rounded-lg">
                <div>
                  <div className="text-sm font-medium">Current Path</div>
                  <div className="text-xs text-gray-600">{structure.path}</div>
                </div>
                <div>
                  <div className="text-sm font-medium">Total Files</div>
                  <div className="text-xs text-gray-600">{structure.totalFiles}</div>
                </div>
                <div>
                  <div className="text-sm font-medium">Total Size</div>
                  <div className="text-xs text-gray-600">{formatFileSize(structure.totalSize)}</div>
                </div>
                <div>
                  <div className="text-sm font-medium">Last Modified</div>
                  <div className="text-xs text-gray-600">{formatDate(structure.lastModified)}</div>
                </div>
              </div>
            )}

            {/* Search Results */}
            {searchResults.length > 0 && (
              <div className="space-y-2">
                <h4 className="font-medium">Search Results ({searchResults.length})</h4>
                <div className="max-h-40 overflow-y-auto space-y-1">
                  {searchResults.map((item) => (
                    <div key={item.id} className="flex items-center gap-2 p-2 bg-blue-50 rounded text-sm">
                      {item.type === 'directory' ? (
                        <Folder className="h-4 w-4 text-blue-600" />
                      ) : (
                        <File className="h-4 w-4 text-gray-600" />
                      )}
                      <span className="flex-1">{item.path}</span>
                      <Badge variant="outline" className="text-xs">
                        {formatFileSize(item.size)}
                      </Badge>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* Directory Contents */}
            {structure && (
              <div className="space-y-4">
                {/* Directories */}
                {structure.directories.length > 0 && (
                  <div>
                    <h4 className="font-medium mb-2">Directories ({structure.directories.length})</h4>
                    <div className="grid gap-2">
                      {structure.directories.map((dir) => (
                        <div
                          key={dir.id}
                          className="flex items-center gap-3 p-3 border rounded-lg hover:bg-gray-50 cursor-pointer"
                          onClick={() => navigateToDirectory(dir.path)}
                        >
                          <Folder className="h-5 w-5 text-blue-600" />
                          <div className="flex-1">
                            <div className="font-medium">{dir.name}</div>
                            <div className="text-xs text-gray-500">
                              {dir.permissions} • Modified {formatDate(dir.modified)}
                            </div>
                          </div>
                          {dir.isHidden && (
                            <Badge variant="secondary" className="text-xs">Hidden</Badge>
                          )}
                        </div>
                      ))}
                    </div>
                  </div>
                )}

                {/* Files */}
                {structure.files.length > 0 && (
                  <div>
                    <h4 className="font-medium mb-2">Files ({structure.files.length})</h4>
                    <div className="grid gap-2">
                      {structure.files.map((file) => (
                        <div key={file.id} className="flex items-center gap-3 p-3 border rounded-lg hover:bg-gray-50">
                          <File className="h-5 w-5 text-gray-600" />
                          <div className="flex-1">
                            <div className="font-medium">{file.name}</div>
                            <div className="text-xs text-gray-500">
                              {formatFileSize(file.size)} • {file.permissions} • Modified {formatDate(file.modified)}
                            </div>
                            {file.checksum && (
                              <div className="text-xs text-gray-400 font-mono">
                                Checksum: {file.checksum}
                              </div>
                            )}
                          </div>
                          {file.extension && (
                            <Badge variant="outline" className="text-xs">
                              {file.extension}
                            </Badge>
                          )}
                          {file.isHidden && (
                            <Badge variant="secondary" className="text-xs">Hidden</Badge>
                          )}
                        </div>
                      ))}
                    </div>
                  </div>
                )}
              </div>
            )}

            {loading && (
              <div className="flex items-center justify-center py-8">
                <RefreshCw className="h-6 w-6 animate-spin" />
                <span className="ml-2">Loading...</span>
              </div>
            )}
          </div>
        </CardContent>
      </Card>
    </div>
  );
}