
import { useState, useEffect } from "react";
import { PageHeader } from "@/components/PageHeader";
import { useAuth } from "@/contexts/AuthContext";
import { supabase } from "@/integrations/supabase/client";
import { Tabs, TabsList, TabsTrigger, TabsContent } from "@/components/ui/tabs";
import { Button } from "@/components/ui/button";
import { FileText, Star, PlusCircle, MessageSquare, FilePen } from "lucide-react";
import { ScriptCard } from "@/components/scripts/ScriptCard";
import { ScriptFilters } from "@/components/scripts/ScriptFilters";
import { GeneratedScript } from "@/types/dashboard";
import { useToast } from "@/components/ui/use-toast";

type ScriptCategory = 'all' | 'favorites' | 'cta' | 'funny' | 'raw';

const ScriptsLibrary = () => {
  const [scripts, setScripts] = useState<GeneratedScript[]>([]);
  const [filteredScripts, setFilteredScripts] = useState<GeneratedScript[]>([]);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState<ScriptCategory>('all');
  const [favorites, setFavorites] = useState<string[]>([]);
  const { user } = useAuth();
  const { toast } = useToast();

  useEffect(() => {
    if (user) {
      fetchScripts();
      fetchFavorites();
    }
  }, [user]);

  const fetchScripts = async () => {
    try {
      const { data, error } = await supabase
        .from("generated_scripts")
        .select("*")
        .eq("user_id", user?.id)
        .order("created_at", { ascending: false });

      if (error) throw error;
      
      setScripts(data || []);
      setFilteredScripts(data || []);
    } catch (error) {
      console.error("Error fetching scripts:", error);
      toast({
        title: "Error fetching scripts",
        description: "There was a problem loading your scripts.",
        variant: "destructive"
      });
    } finally {
      setLoading(false);
    }
  };

  const fetchFavorites = async () => {
    try {
      // This would connect to a favorites table or metadata field
      // For now, we'll just use local storage as a placeholder
      const savedFavorites = localStorage.getItem(`script_favorites_${user?.id}`);
      if (savedFavorites) {
        setFavorites(JSON.parse(savedFavorites));
      }
    } catch (error) {
      console.error("Error fetching favorites:", error);
    }
  };

  const toggleFavorite = (scriptId: string) => {
    let newFavorites: string[];
    
    if (favorites.includes(scriptId)) {
      newFavorites = favorites.filter(id => id !== scriptId);
    } else {
      newFavorites = [...favorites, scriptId];
    }
    
    setFavorites(newFavorites);
    localStorage.setItem(`script_favorites_${user?.id}`, JSON.stringify(newFavorites));
    
    // Re-filter if we're on the favorites tab
    if (activeTab === 'favorites') {
      applyFilters('favorites');
    }
  };

  const applyFilters = (category: ScriptCategory, filters?: Record<string, any>) => {
    setActiveTab(category);
    
    let filtered = [...scripts];
    
    // Apply category filter
    if (category === 'favorites') {
      filtered = filtered.filter(script => favorites.includes(script.id));
    } else if (category === 'cta') {
      filtered = filtered.filter(script => 
        script.content.toLowerCase().includes('link in bio') || 
        script.content.toLowerCase().includes('follow me') ||
        script.content.toLowerCase().includes('subscribe')
      );
    } else if (category === 'funny') {
      filtered = filtered.filter(script => 
        script.content.toLowerCase().includes('laugh') || 
        script.content.toLowerCase().includes('joke') ||
        script.hook.toLowerCase().includes('funny')
      );
    } else if (category === 'raw') {
      filtered = filtered.filter(script => 
        !script.content.toLowerCase().includes('link in bio') &&
        !script.content.toLowerCase().includes('follow')
      );
    }
    
    // Apply additional filters if provided
    if (filters) {
      if (filters.contentType && filters.contentType !== 'all') {
        filtered = filtered.filter(script => 
          script.format_type.toLowerCase() === filters.contentType.toLowerCase()
        );
      }
      
      if (filters.length && filters.length !== 'all') {
        if (filters.length === 'short') {
          filtered = filtered.filter(script => script.content.length < 300);
        } else if (filters.length === 'medium') {
          filtered = filtered.filter(script => 
            script.content.length >= 300 && script.content.length < 600
          );
        } else if (filters.length === 'long') {
          filtered = filtered.filter(script => script.content.length >= 600);
        }
      }
    }
    
    setFilteredScripts(filtered);
  };

  const handleFilterChange = (filters: Record<string, any>) => {
    applyFilters(activeTab, filters);
  };

  const navigateToGenerateScripts = () => {
    window.location.href = '/generate-scripts';
  };

  if (!user) {
    return <div className="p-6">Please log in to access this feature.</div>;
  }

  return (
    <div className="container mx-auto py-10 px-4">
      <div className="max-w-6xl mx-auto">
        <PageHeader 
          title="Scripts Library" 
          description="Browse and manage your content scripts"
          icon={<FileText className="h-6 w-6 text-socialmize-purple" />}
          actions={
            <Button 
              onClick={navigateToGenerateScripts}
              className="bg-gradient-to-r from-socialmize-purple to-socialmize-dark-purple hover:opacity-90 transition-opacity"
            >
              <PlusCircle className="h-4 w-4 mr-2" />
              Generate New Scripts
            </Button>
          }
        />
        
        <div className="mt-8">
          <ScriptFilters onFilterChange={handleFilterChange} />
          
          <Tabs defaultValue="all" className="mt-6" onValueChange={(value) => applyFilters(value as ScriptCategory)}>
            <TabsList className="mb-6 w-full sm:w-auto">
              <TabsTrigger value="all" className="flex items-center gap-1">
                <FileText className="h-4 w-4" />
                <span>All Scripts</span>
              </TabsTrigger>
              <TabsTrigger value="favorites" className="flex items-center gap-1">
                <Star className="h-4 w-4" />
                <span>Favorites</span>
              </TabsTrigger>
              <TabsTrigger value="cta" className="flex items-center gap-1">
                <MessageSquare className="h-4 w-4" />
                <span>With CTA</span>
              </TabsTrigger>
              <TabsTrigger value="funny" className="flex items-center gap-1">
                <FilePen className="h-4 w-4" />
                <span>Funny</span>
              </TabsTrigger>
              <TabsTrigger value="raw" className="flex items-center gap-1">
                <FileText className="h-4 w-4" />
                <span>Raw Content</span>
              </TabsTrigger>
            </TabsList>
            
            {['all', 'favorites', 'cta', 'funny', 'raw'].map((tab) => (
              <TabsContent key={tab} value={tab} className="space-y-4">
                {loading ? (
                  <div className="flex justify-center items-center h-64">
                    <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-socialmize-purple"></div>
                  </div>
                ) : filteredScripts.length === 0 ? (
                  <div className="text-center py-12">
                    <FileText className="h-12 w-12 mx-auto text-muted-foreground mb-4" />
                    <h3 className="text-xl font-medium mb-2">No Scripts Found</h3>
                    <p className="text-muted-foreground mb-6">
                      {tab === 'favorites' 
                        ? "You haven't added any scripts to your favorites yet." 
                        : "No scripts match your current filters."}
                    </p>
                    {tab === 'all' && (
                      <Button 
                        onClick={navigateToGenerateScripts}
                        className="bg-gradient-to-r from-socialmize-purple to-socialmize-dark-purple hover:opacity-90 transition-opacity"
                      >
                        Generate Your First Script
                      </Button>
                    )}
                  </div>
                ) : (
                  <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                    {filteredScripts.map((script) => (
                      <ScriptCard 
                        key={script.id} 
                        script={script} 
                        isFavorite={favorites.includes(script.id)}
                        onToggleFavorite={() => toggleFavorite(script.id)}
                      />
                    ))}
                  </div>
                )}
              </TabsContent>
            ))}
          </Tabs>
        </div>
      </div>
    </div>
  );
};

export default ScriptsLibrary;
