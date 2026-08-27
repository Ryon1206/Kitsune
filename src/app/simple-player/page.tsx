"use client";

import React, { useState } from "react";

interface AnimeItem {
  id: string;
  title: string;
  image: string;
}

export default function SimplePlayerPage() {
  const [query, setQuery] = useState("");
  const [results, setResults] = useState<AnimeItem[]>([]);
  const [videoUrl, setVideoUrl] = useState("");
  const [loading, setLoading] = useState(false);
  const [statusMsg, setStatusMsg] = useState("");

  const searchAnime = async () => {
    if (!query) return;
    setLoading(true);
    setStatusMsg("検索中...");
    setVideoUrl("");
    try {
      const res = await fetch(`https://api.consumet.org/anime/gogoanime/${encodeURIComponent(query)}`);
      const data = await res.json();
      if (data.results && data.results.length > 0) {
        setResults(data.results);
        setStatusMsg("");
      } else {
        setResults([]);
        setStatusMsg("アニメが見つかりませんでした。英語名で検索してください（例: Naruto, Bleach）");
      }
    } catch (err) {
      setStatusMsg("検索に失敗しました。");
    } finally {
      setLoading(false);
    }
  };

  const playAnime = async (animeId: string) => {
    setStatusMsg("動画URLを取得中...");
    setVideoUrl("");
    try {
      const infoRes = await fetch(`https://api.consumet.org/anime/gogoanime/info/${animeId}`);
      const infoData = await infoRes.json();
      
      if (!infoData.episodes || infoData.episodes.length === 0) {
        setStatusMsg("エピソードが見つかりませんでした。");
        return;
      }

      const epId = infoData.episodes[0].id;
      const watchRes = await fetch(`https://api.consumet.org/anime/gogoanime/watch/${epId}`);
      const watchData = await watchRes.json();
      const stream = watchData.sources?.find((s: any) => s.quality === "default") || watchData.sources?.[0];

      if (stream && stream.url) {
        setVideoUrl(stream.url);
        setStatusMsg(`再生中: ${infoData.title || animeId}`);
      } else {
        setStatusMsg("動画URLの抽出に失敗しました。");
      }
    } catch (err) {
      setStatusMsg("再生エラーが発生しました。");
    }
  };

  return (
    <div style={{ padding: "20px", color: "#fff", background: "#0f0f0f", minHeight: "100vh" }}>
      <h2>🦊 Kitsune Stream Player</h2>
      
      <div style={{ display: "flex", gap: "10px", marginBottom: "15px" }}>
        <input
          type="text"
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          placeholder="アニメタイトル (例: Naruto)"
          style={{ padding: "10px", flex: 1, borderRadius: "6px", border: "1px solid #333", background: "#222", color: "#fff" }}
        />
        <button 
          onClick={searchAnime} 
          style={{ padding: "10px 20px", background: "#e50914", color: "#fff", border: "none", borderRadius: "6px", cursor: "pointer" }}
        >
          検索
        </button>
      </div>

      {statusMsg && <p style={{ color: "#ff9900", marginBottom: "15px" }}>{statusMsg}</p>}

      {videoUrl && (
        <div style={{ marginBottom: "20px" }}>
          <video 
            controls 
            autoPlay 
            src={videoUrl} 
            style={{ width: "100%", maxHeight: "450px", background: "#000", borderRadius: "8px" }} 
          />
        </div>
      )}

      <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fill, minmax(140px, 1fr))", gap: "15px" }}>
        {results.map((item) => (
          <div 
            key={item.id} 
            onClick={() => playAnime(item.id)} 
            style={{ cursor: "pointer", background: "#1f1f1f", padding: "10px", borderRadius: "8px", border: "1px solid #333" }}
          >
            <img src={item.image} alt={item.title} style={{ width: "100%", height: "180px", objectFit: "cover", borderRadius: "4px" }} />
            <p style={{ fontSize: "12px", marginTop: "8px", height: "32px", overflow: "hidden" }}>{item.title}</p>
          </div>
        ))}
      </div>
    </div>
  );
}
