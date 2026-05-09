import { useState, useCallback } from "react";
import { blogAPI } from "@/lib/api";
import { Blog, BlogListItem, GenerateRequest } from "@/types/blog";
import { toast } from "sonner";

export const useBlogs = () => {
  const [blogs, setBlogs] = useState<BlogListItem[]>([]);
  const [isLoading, setIsLoading] = useState(false);

  const fetchBlogs = useCallback(async () => {
    setIsLoading(true);
    try {
      const data = await blogAPI.list();
      setBlogs(data.blogs);
    } catch (error) {
      toast.error("Failed to load blogs");
    } finally {
      setIsLoading(false);
    }
  }, []);

  const generateBlog = async (request: GenerateRequest) => {
    setIsLoading(true);
    try {
      const blog = await blogAPI.generate(request);
      toast.success("Blog generated successfully!");
      return blog;
    } catch (error: any) {
      const msg = error.response?.data?.detail || "Generation failed. Quality check didn't pass.";
      toast.error(msg);
      throw error;
    } finally {
      setIsLoading(false);
    }
  };

  const getBlog = async (id: string) => {
    try {
      return await blogAPI.getById(id);
    } catch (error) {
      toast.error("Failed to fetch blog details");
      throw error;
    }
  };

  const deleteBlog = async (id: string) => {
    try {
      await blogAPI.delete(id);
      setBlogs((prev) => prev.filter((b) => b.id !== id));
      toast.success("Blog deleted");
    } catch (error) {
      toast.error("Failed to delete blog");
    }
  };

  return {
    blogs,
    isLoading,
    fetchBlogs,
    generateBlog,
    getBlog,
    deleteBlog,
  };
};
