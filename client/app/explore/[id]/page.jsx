"use client";
import { useEffect, useState } from "react";
import { useParams } from "next/navigation";

export default function PostDetailsPage() {
  const { id } = useParams();
  const [post, setPost] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (id) {
      fetch(`https://community-platform-b5wm.onrender.com/api/posts/${id}`)
        .then((res) => res.json())
        .then((data) => {
          setPost(data);
          setLoading(false);
        })
        .catch((err) => {
          console.error(err);
          setLoading(false);
        });
    }
  }, [id]);

  if (loading) return <div className="p-8 text-center">Loading...</div>;
  if (!post) return <div className="p-8 text-center">Post not found</div>;

  return (
    <div className="max-w-3xl mx-auto p-6 bg-white shadow-md rounded-lg mt-10">
      <span className="px-3 py-1 bg-orange-100 text-orange-600 rounded-full text-sm font-semibold">
        {post.type}
      </span>
      <h1 className="text-2xl font-bold mt-4">{post.title}</h1>
      <p className="text-gray-600 mt-2">{post.description}</p>
      <div className="mt-4 text-sm text-gray-500">
        <p>Category: {post.category}</p>
        <p>Location: {post.location?.city}, Bangladesh</p>
      </div>
    </div>
  );
}
