import { useEffect, useState, useRef } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { Card, Typography, Button, message, Space, Spin, Progress } from "antd";
import { PlayCircleOutlined, ArrowLeftOutlined } from "@ant-design/icons";
import api from "../../components/fetch";
import { getUserEmail } from "../../components";
import BackgroundLogo from "../../components/Background";

const { Title } = Typography;

const GamePlay = () => {
  const { sessionId } = useParams();
  const navigate = useNavigate();
  const [gameId, setGameId] = useState(null);
  const [currentQuestion, setCurrentQuestion] = useState(null);
  const [loading, setLoading] = useState(true);
  const [, setSelectedAnswers] = useState([]);
  const [timeLeft, setTimeLeft] = useState(0);

  const [playerCount, setPlayerCount] = useState(0);
  const [gameStarted, setGameStarted] = useState(false);
  const pollingRef = useRef(null);
  const [showAnswer, setShowAnswer] = useState(false);
  const [hasStarted, setHasStarted] = useState(false);
  const timerId = useRef(null);
  const [isLastQuestion, setIsLastQuestion] = useState(false);

  //checkall Game status
  const fetchGameStatus = async () => {
    try {
      const res = await api.get(`/admin/session/${sessionId}/status`);
      const status = res.results;
      setPlayerCount(status.players?.length || 0);
      setGameStarted(status.active);

      if (
        status.position >= 0 &&
        status.questions &&
        status.questions.length > status.position
      ) {
        const q = status.questions[status.position];
        setIsLastQuestion(status.position === status.questions.length - 1);
        if (!currentQuestion || currentQuestion.id !== q.id) {
          setCurrentQuestion(q);
          setShowAnswer(false);
          setSelectedAnswers([]);
        }
      } else {
        setCurrentQuestion(null);
      }
    } catch (error) {
      console.error("Error fetching status:", error);
    }
  };

  // startpoll
  const startPolling = () => {
    if (pollingRef.current) {
      clearInterval(pollingRef.current);
    }
    fetchGameStatus();
    pollingRef.current = setInterval(fetchGameStatus, 2000);
  };

  // stoppoll
  const stopPolling = () => {
    if (pollingRef.current) {
      clearInterval(pollingRef.current);
      pollingRef.current = null;
    }
  };

  //checkgameDate
  useEffect(() => {
    const fetchGameData = async () => {
      try {
        const response = await api.get("/admin/games");
        const game = response.games.find((g) => {
          return (
            (g.active && g.active.toString() === sessionId.toString()) ||
            (g.oldSessions &&
              g.oldSessions.some((s) => s.toString() === sessionId.toString()))
          );
        });

        if (game) {
          const isAdminer = game.owner === getUserEmail();
          if (!isAdminer) {
            navigate(`/play/join/${sessionId}`);
            return;
          }
          setGameId(game.id);
          startPolling();
        } else {
          message.error("Game not found for this session");
        }
      } catch (error) {
        message.error(error.message || "Failed to fetch game data");
      } finally {
        setLoading(false);
      }
    };
    if (sessionId) {
      fetchGameData();
    }
    return () => {
      stopPolling();
      if (timerId.current) {
        clearInterval(timerId.current);
        timerId.current = null;
      }
    };
  }, [sessionId, navigate]);

  //set Timer
  useEffect(() => {
    if (currentQuestion && gameStarted && !showAnswer) {
      setTimeLeft(currentQuestion.duration || 30);

      if (timerId.current) clearInterval(timerId.current);

      timerId.current = setInterval(() => {
        setTimeLeft((prev) => {
          if (prev <= 1) {
            clearInterval(timerId.current);
            return 0;
          }
          return prev - 1;
        });
      }, 1000);
    }

    return () => {
      if (timerId.current) clearInterval(timerId.current);
    };
  }, [currentQuestion?.id, gameStarted, showAnswer]);
  //nextGame Button
  const handleStarNextGame = async () => {
    if (!gameId) {
      message.error("Game Id is not Valied");
      return;
    }
    const mutate =
      hasStarted || gameStarted
        ? isLastQuestion
          ? "END"
          : "ADVANCE"
        : "START";

    try {
      await api.post(`/admin/game/${gameId}/mutate`, {
        mutationType: mutate,
      });
      if (mutate === "START") {
        setHasStarted(true);
        setGameStarted(true);
        message.success("Game started!", 5);
      } else if (mutate === "ADVANCE") {
        message.success("Advanced to next question", 5);
      } else if (mutate === "END") {
        message.success("Game finished!", 5);
        //stop all timers and polling
        if (timerId.current) {
          clearInterval(timerId.current);
          timerId.current = null;
        }
        stopPolling();
        navigate(`/session/${sessionId}/result`);
        return;
      }
      setShowAnswer(false);
      setSelectedAnswers([]);
      await fetchGameStatus();
    } catch (error) {
      console.error("Mutate error response:", error?.response?.data || error);
      message.error(
        error?.response?.data?.error ||
          error.message ||
          "Failed to mutate game",
        5
      );
    }
  };

  if (loading) {
    return (
      <div style={{ padding: "24px", textAlign: "center" }}>
        <Spin size="large" />
        <Typography.Text>Loading...</Typography.Text>
      </div>
    );
  }

  return (
    <div
      style={{
        maxWidth: "800px",
        margin: "0 auto",
        padding: "20px",
      }}
    >
      <Button
        type="text"
        icon={<ArrowLeftOutlined />}
        onClick={() => navigate("/dashboard")}
        style={{ color: "#af1441" }}
      >
        BackToDashboard
      </Button>
      <BackgroundLogo />
      <Card>
        <Title level={2}>Game Lobby (Admin)</Title>
        <Space direction="vertical" size="large" style={{ width: "100%" }}>
          <Typography.Text strong>
            Players Joined: {playerCount}
          </Typography.Text>
          <Button
            type="primary"
            icon={<PlayCircleOutlined />}
            onClick={handleStarNextGame}
            block
            data-cy="next-step"
            disabled={gameStarted && currentQuestion && timeLeft > 0}
          >
            {currentQuestion
              ? isLastQuestion
                ? "Finish Game"
                : "Next Question"
              : "Start Game"}
          </Button>
        </Space>

        {gameStarted && currentQuestion && (
          <>
            <div style={{ margin: "24px 0" }}>
              <Progress
                percent={(timeLeft / (currentQuestion.duration || 30)) * 100}
                status={timeLeft < 5 ? "exception" : "active"}
                format={() => `${timeLeft}s`}
              />
            </div>
            <Title level={3}>{currentQuestion.question}</Title>
            {currentQuestion.image && (
              <img
                src={currentQuestion.image}
                alt="Question"
                style={{ maxWidth: "100%", marginBottom: 16 }}
              />
            )}
            <Space direction="vertical" size="large" style={{ width: "100%" }}>
              {currentQuestion.answers.map((item, index) => {
                const answerText =
                  typeof item === "object" && "answer" in item
                    ? item.answer
                    : item;
                return (
                  <Button key={index} block disabled>
                    {answerText}
                  </Button>
                );
              })}
            </Space>
          </>
        )}
      </Card>
    </div>
  );
};

export default GamePlay;
