import { createContext, useContext, useState, useEffect, ReactNode } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { apiRequest, queryClient } from "./queryClient";
import { useApp } from "./store";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Loader2, Edit, Check, X, Save } from "lucide-react";
import { cn } from "@/lib/utils";
import { useToast } from "@/hooks/use-toast";

type ContentMap = Record<string, string>;

type AdminContentItem = {
    content: string;
    draftContent: string | null;
    isPublished: boolean;
    lastPublishedAt: string | null;
};

type AdminContentMap = Record<string, AdminContentItem>;

interface ContentContextType {
    content: ContentMap;
    adminContent: AdminContentMap;
    isLoading: boolean;
    isEditMode: boolean;
    toggleEditMode: () => void;
    updateContent: (key: string, value: string) => Promise<void>;
    publishContent: () => Promise<void>;
    isPublishing: boolean;
    hasUnpublishedChanges: boolean;
}

const ContentContext = createContext<ContentContextType | null>(null);

export function ContentProvider({ children }: { children: ReactNode }) {
    const { user } = useApp();
    const isAdmin = user?.role === "admin";
    const [isEditMode, setIsEditMode] = useState(false);
    const { toast } = useToast();
    const queryClient = useQueryClient();

    // Fetch public content for everyone
    const { data: publicContent = {}, isLoading: isLoadingPublic } = useQuery<ContentMap>({
        queryKey: ["/api/content"],
        staleTime: 5 * 60 * 1000, // 5 minutes
    });

    // Fetch admin content only if admin and in edit mode (or just admin)
    const { data: adminContent = {}, isLoading: isLoadingAdmin } = useQuery<AdminContentMap>({
        queryKey: ["/api/admin/content"],
        enabled: !!isAdmin,
    });

    const updateMutation = useMutation({
        mutationFn: async ({ key, value }: { key: string; value: string }) => {
            const res = await apiRequest("POST", "/api/admin/content", { key, value });
            return res.json();
        },
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: ["/api/admin/content"] });
        },
        onError: (error) => {
            toast({
                title: "Failed to update content",
                description: error.message,
                variant: "destructive",
            });
        },
    });

    const publishMutation = useMutation({
        mutationFn: async () => {
            const res = await apiRequest("POST", "/api/admin/content/publish");
            return res.json();
        },
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: ["/api/content"] });
            queryClient.invalidateQueries({ queryKey: ["/api/admin/content"] });
            toast({
                title: "Content Published",
                description: "All changes are now live.",
            });
            setIsEditMode(false);
        },
        onError: (error) => {
            toast({
                title: "Failed to publish",
                description: error.message,
                variant: "destructive",
            });
        },
    });

    const hasUnpublishedChanges = Object.values(adminContent).some(
        (item: any) =>
            (item.draftContent && item.draftContent !== item.content) ||
            !item.isPublished
    );

    // Combine content: use admin drafts if in edit mode, otherwise use published content
    // Actually, we should simpler: 
    // If not admin: use publicContent
    // If admin: use adminContent (which has draft info)

    // But for the "content" map consumed by components, we need a simple string map.
    // If in edit mode, we show drafts. If not, we show live.
    const contentToUse: ContentMap = isAdmin && isEditMode
        ? Object.fromEntries(
            Object.entries(adminContent as AdminContentMap).map(([k, v]) => [
                k,
                v.draftContent ?? v.content,
            ])
        )
        : (publicContent as ContentMap);

    const toggleEditMode = () => setIsEditMode(!isEditMode);

    return (
        <ContentContext.Provider
            value={{
                content: (isAdmin && isEditMode ? contentToUse : publicContent) as ContentMap, // Logic refinement
                adminContent: adminContent as AdminContentMap,
                isLoading: isLoadingPublic || (isAdmin && isLoadingAdmin),
                isEditMode: isAdmin && isEditMode,
                toggleEditMode,
                updateContent: async (key, value) => updateMutation.mutateAsync({ key, value }),
                publishContent: async () => publishMutation.mutateAsync(),
                isPublishing: publishMutation.isPending,
                hasUnpublishedChanges
            }}
        >
            {children}
        </ContentContext.Provider>
    );
}

export function useContent() {
    const context = useContext(ContentContext);
    if (!context) {
        throw new Error("useContent must be used within a ContentProvider");
    }
    return context;
}

interface EditableTextProps {
    name: string;
    default: string; // Default value if no content exists
    className?: string;
    multiline?: boolean;
}

export function EditableText({ name, default: defaultValue, className, multiline }: EditableTextProps) {
    const { content, isEditMode, updateContent } = useContent();
    const [isEditing, setIsEditing] = useState(false);
    const [value, setValue] = useState("");

    // Get current value from context or default
    const currentValue = content[name] || defaultValue;

    useEffect(() => {
        setValue(currentValue);
    }, [currentValue]);

    const handleSave = async () => {
        if (value !== currentValue) {
            await updateContent(name, value);
        }
        setIsEditing(false);
    };

    const handleCancel = () => {
        setValue(currentValue);
        setIsEditing(false);
    };

    if (isEditMode && isEditing) {
        return (
            <div className={cn("relative group", className)}>
                {multiline ? (
                    <Textarea
                        value={value}
                        onChange={(e) => setValue(e.target.value)}
                        className="min-h-[100px] pr-20"
                        autoFocus
                    />
                ) : (
                    <Input
                        value={value}
                        onChange={(e) => setValue(e.target.value)}
                        className="pr-20"
                        autoFocus
                    />
                )}
                <div className="absolute right-1 top-1 flex gap-1 z-10">
                    <Button size="icon" variant="ghost" className="h-6 w-6 bg-green-100 hover:bg-green-200 text-green-700" onClick={handleSave}>
                        <Check className="h-3 w-3" />
                    </Button>
                    <Button size="icon" variant="ghost" className="h-6 w-6 bg-red-100 hover:bg-red-200 text-red-700" onClick={handleCancel}>
                        <X className="h-3 w-3" />
                    </Button>
                </div>
            </div>
        );
    }

    if (isEditMode) {
        return (
            <div
                className={cn(
                    "relative border border-dashed border-transparent hover:border-primary/50 rounded cursor-text transition-colors p-0.5 -m-0.5",
                    className
                )}
                onClick={() => setIsEditing(true)}
                title={`Click to edit: ${name}`}
            >
                {currentValue}
                <div className="absolute -top-3 -right-3 hidden group-hover:flex bg-primary text-white p-1 rounded-full shadow-sm">
                    <Edit className="h-3 w-3" />
                </div>
            </div>
        );
    }

    return <span className={className}>{currentValue}</span>;
}

export function AdminToolbar() {
    const { user } = useApp();
    const { isEditMode, toggleEditMode, publishContent, isPublishing, hasUnpublishedChanges } = useContent();

    if (user?.role !== "admin") return null;

    return (
        <div className="fixed bottom-4 right-4 z-50 flex flex-col gap-2">
            {hasUnpublishedChanges && (
                <Button
                    size="sm"
                    onClick={() => publishContent()}
                    disabled={isPublishing}
                    className="bg-green-600 hover:bg-green-700 text-white shadow-lg"
                >
                    {isPublishing ? <Loader2 className="h-4 w-4 animate-spin mr-2" /> : <Save className="h-4 w-4 mr-2" />}
                    Publish Changes
                </Button>
            )}
            <Button
                size="sm"
                variant={isEditMode ? "default" : "secondary"}
                onClick={toggleEditMode}
                className="shadow-lg border border-primary/20"
            >
                <Edit className="h-4 w-4 mr-2" />
                {isEditMode ? "Exit Edit Mode" : "Edit Content"}
            </Button>
        </div>
    );
}
