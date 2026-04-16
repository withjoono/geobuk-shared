import React, { useState, useEffect, useRef } from "react";
import { MessageCircle, X, ChevronLeft, Send } from "lucide-react";
import { HubCommentApi, HubComment, HubCommentPartner } from "./api.js";
import { cn } from "../../utils/index.js";

export interface HubCommentWidgetProps {
  hubApiUrl: string;
  sourceApp: "susi" | "jungsi" | "studyplanner" | "examhub" | "mysanggibu" | "tutorboard" | "teacher" | "mogo" | string;
}

export function HubCommentWidget({ hubApiUrl, sourceApp }: HubCommentWidgetProps) {
  const [isOpen, setIsOpen] = useState(false);
  const [unreadCount, setUnreadCount] = useState(0);
  const [api] = useState(() => new HubCommentApi(hubApiUrl));

  // --- Views: "list" | "chat"
  const [view, setView] = useState<"list" | "chat">("list");
  const [partners, setPartners] = useState<HubCommentPartner[]>([]);
  const [activePartner, setActivePartner] = useState<HubCommentPartner | null>(null);
  
  // --- Chat Data
  const [comments, setComments] = useState<HubComment[]>([]);
  const [inputText, setInputText] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  
  const scrollRef = useRef<HTMLDivElement>(null);

  // 1. Initial Unread Count & Partners Load
  useEffect(() => {
    const fetchInitialData = async () => {
      try {
        const count = await api.getUnreadCount();
        setUnreadCount(count);
      } catch (err) {
        console.error("HubCommentWidget: Failed to fetch unread count", err);
      }
    };
    fetchInitialData();
  }, [api]);

  // Load partners when opening widget in "list" view
  useEffect(() => {
    if (isOpen && view === "list") {
      api.getPartners().then(data => {
        setPartners(data);
      }).catch(console.error);
      // Refresh unread count too
      api.getUnreadCount().then(setUnreadCount).catch(console.error);
    }
  }, [isOpen, view, api]);

  // Load chat when activePartner changes
  useEffect(() => {
    if (isOpen && view === "chat" && activePartner) {
      setIsLoading(true);
      api.getConversation(activePartner.partnerId)
        .then(data => {
          if (data?.comments) {
            setComments(data.comments);
          }
          // Mark all as read
          if (activePartner.unreadCount > 0) {
            api.markAllAsRead(activePartner.partnerId)
              .then(() => api.getUnreadCount())
              .then(setUnreadCount)
              .catch(console.error);
          }
        })
        .finally(() => {
          setIsLoading(false);
          scrollToBottom();
        });
    }
  }, [isOpen, view, activePartner, api]);

  const scrollToBottom = () => {
    setTimeout(() => {
      if (scrollRef.current) {
        scrollRef.current.scrollTop = scrollRef.current.scrollHeight;
      }
    }, 50);
  };

  const handleSend = async () => {
    if (!inputText.trim() || !activePartner) return;
    try {
      const newComment = await api.createComment({
        target_id: activePartner.partnerId,
        content: inputText.trim(),
        source_app: sourceApp,
      });
      setComments(prev => [...prev, newComment]);
      setInputText("");
      scrollToBottom();
    } catch (err) {
      console.error("Failed to send comment", err);
    }
  };

  const handleOpenChat = (partner: HubCommentPartner) => {
    setActivePartner(partner);
    setView("chat");
  };

  const handleBackToList = () => {
    setActivePartner(null);
    setView("list");
  };

  return (
    <>
      {/* Floating Button */}
      <button
        onClick={() => setIsOpen(!isOpen)}
        className={cn(
          "fixed bottom-6 right-6 z-[9999] flex h-14 w-14 items-center justify-center rounded-full bg-blue-600 text-white shadow-lg transition-transform hover:scale-105 active:scale-95",
          isOpen && "rotate-12 scale-90 opacity-0 pointer-events-none"
        )}
      >
        <MessageCircle className="h-6 w-6" />
        {unreadCount > 0 && (
          <span className="absolute -top-1 -right-1 flex h-5 w-5 items-center justify-center rounded-full bg-red-500 text-[10px] font-bold text-white shadow-sm ring-2 ring-white">
            {unreadCount > 99 ? "99+" : unreadCount}
          </span>
        )}
      </button>

      {/* Chat Popover Window */}
      <div
        className={cn(
          "fixed bottom-6 right-6 z-[9999] flex h-[600px] w-[350px] max-h-[80vh] max-w-[calc(100vw-3rem)] flex-col overflow-hidden rounded-2xl bg-white shadow-2xl transition-all duration-300 ease-in-out border border-gray-200",
          isOpen ? "translate-y-0 opacity-100" : "translate-y-8 opacity-0 pointer-events-none"
        )}
      >
        {/* Header */}
        <div className="flex shrink-0 items-center justify-between border-b bg-blue-600 p-4 text-white">
          <div className="flex items-center gap-2">
            {view === "chat" && (
              <button onClick={handleBackToList} className="rounded p-1 hover:bg-white/20 transition-colors">
                <ChevronLeft className="h-5 w-5" />
              </button>
            )}
            <h3 className="font-semibold text-sm">
              {view === "list" ? "상담 및 코멘트" : activePartner?.partnerName || "채팅"}
            </h3>
          </div>
          <button onClick={() => setIsOpen(false)} className="rounded p-1 opacity-70 hover:opacity-100 hover:bg-white/20 transition-colors">
            <X className="h-5 w-5" />
          </button>
        </div>

        {/* Content Area */}
        <div className="flex-1 overflow-hidden bg-gray-50 flex flex-col relative w-full h-full">
          {view === "list" && (
            <div className="flex-1 overflow-y-auto w-full">
              {partners.length === 0 ? (
                <div className="flex h-full flex-col items-center justify-center p-6 text-center">
                  <MessageCircle className="mb-4 h-12 w-12 text-gray-300" />
                  <p className="text-sm font-medium text-gray-600">진행 중인 대화가 없습니다.</p>
                  <p className="mt-1 text-xs text-gray-400">선생님 또는 학부모님이 코멘트를 남기면 이곳에 표시됩니다.</p>
                </div>
              ) : (
                <ul className="divide-y divide-gray-100">
                  {partners.map(p => (
                    <li key={p.partnerId}>
                      <button
                        onClick={() => handleOpenChat(p)}
                        className="flex w-full items-start gap-3 bg-white p-4 text-left transition-colors hover:bg-blue-50"
                      >
                        <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-blue-100 text-blue-700 font-bold">
                          {p.partnerName.charAt(0)}
                        </div>
                        <div className="flex-1 overflow-hidden">
                          <div className="flex items-center justify-between">
                            <span className="font-medium text-sm text-gray-900">{p.partnerName}</span>
                            {p.lastMessage && (
                              <span className="text-[10px] text-gray-500">
                                {new Date(p.lastMessage.createdAt).toLocaleDateString()}
                              </span>
                            )}
                          </div>
                          <div className="mt-1 flex items-center justify-between">
                            <p className="truncate text-xs text-gray-500">
                              {p.lastMessage?.content || "대화를 시작해보세요."}
                            </p>
                            {p.unreadCount > 0 && (
                              <span className="flex h-4 min-w-4 items-center justify-center rounded-full bg-red-500 px-1 text-[10px] font-bold text-white">
                                {p.unreadCount}
                              </span>
                            )}
                          </div>
                        </div>
                      </button>
                    </li>
                  ))}
                </ul>
              )}
            </div>
          )}

          {view === "chat" && (
            <>
              {/* Messages Scroll Area */}
              <div ref={scrollRef} className="flex-1 overflow-y-auto p-4 space-y-4">
                {isLoading ? (
                  <div className="flex h-full items-center justify-center">
                    <span className="text-sm text-gray-400 animate-pulse">불러오는 중...</span>
                  </div>
                ) : comments.length === 0 ? (
                  <div className="flex h-full items-center justify-center text-sm text-gray-400">
                    첫 메시지를 보내보세요.
                  </div>
                ) : (
                  comments.map(c => {
                    // Very simple determination of "mine" vs "theirs" based on role assumption
                    // Since the widget runs in Susi, logged in user is mostly a student.
                    // Instead of full auth state, we can check if authorRole matches our context,
                    // but we don't have current user info easily here.
                    // Wait, we DO know the partnerId. If authorId !== activePartner.partnerId, it's MINE.
                    const isMine = c.authorId !== activePartner?.partnerId;

                    return (
                      <div key={c.id} className={cn("flex w-full", isMine ? "justify-end" : "justify-start")}>
                        <div className={cn(
                          "max-w-[85%] rounded-2xl px-4 py-2 text-sm shadow-sm",
                          isMine ? "bg-blue-600 text-white rounded-br-none" : "bg-white border border-gray-100 text-gray-800 rounded-bl-none"
                        )}>
                          {!isMine && c.author?.nickname && (
                            <div className="mb-1 text-[10px] font-semibold text-gray-400">
                              {c.author.nickname}
                            </div>
                          )}
                          <div className="whitespace-pre-wrap">{c.content}</div>
                          <div className={cn(
                            "mt-1 text-[9px] text-right opacity-70",
                            isMine ? "text-blue-100" : "text-gray-400"
                          )}>
                            {new Date(c.createdAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                          </div>
                        </div>
                      </div>
                    );
                  })
                )}
              </div>

              {/* Input Area */}
              <div className="shrink-0 border-t bg-white p-3 flex gap-2">
                <input
                  type="text"
                  value={inputText}
                  placeholder="메시지 입력..."
                  onChange={(e) => setInputText(e.target.value)}
                  onKeyDown={(e) => e.key === "Enter" && handleSend()}
                  className="flex-1 rounded-full border border-gray-200 bg-gray-50 px-4 py-2 text-sm outline-none focus:border-blue-500 focus:bg-white focus:ring-2 focus:ring-blue-100 transition-all"
                />
                <button
                  onClick={handleSend}
                  disabled={!inputText.trim()}
                  className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full bg-blue-600 text-white disabled:bg-gray-300 disabled:opacity-50 transition-colors"
                >
                  <Send className="h-4 w-4 ml-0.5" />
                </button>
              </div>
            </>
          )}
        </div>
      </div>
    </>
  );
}
