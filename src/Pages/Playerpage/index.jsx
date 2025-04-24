import { useState, useEffect, useRef } from "react";
import { useParams, useNavigate } from "react-router-dom";
import {
  Card,
  Typography,
  Button,
  Input,
  message,
  Space,
  Spin,
  Progress,
} from "antd";
import { UserOutlined } from "@ant-design/icons";
import api from "../../components/fetch";
import BackgroundLogo from "../../components/Background";

const { Title, Text } = Typography;

const PlayerGame = () => {
  //state  for gameplay and player
  const { sessionId } = useParams();
  const [playerName, setPlayerName] = useState("");
  const [playerId, setPlayerId] = useState(null);
  const [currentQuestion, setCurrentQuestion] = useState(null);
  const [loading, setLoading] = useState(false);
  const [joined, setJoined] = useState(false);
  const [selectedAnswers, setSelectedAnswers] = useState([]);
  const [timeLeft, setTimeLeft] = useState(0);
  const [showAnswer, setShowAnswer] = useState(false);
  const [gameStarted, setGameStarted] = useState(false);
  const [answered, setAnswered] = useState(false);
  const [result, setResult] = useState(null);
  const [submitting, setSubmitting] = useState(false);
  const nav = useNavigate();
  const [history, setHistory] = useState([]);
  const [gameOver, setGameOver] = useState(false);
  //polling
  const timerId = useRef(null);
  const pollingRef = useRef(null);
  const currentQuestionRef = useRef(null);
  // minigame
  const [balloonSize, setBalloonSize] = useState(50);
  const [popMessage, setPopMessage] = useState("");
  const [showPop, setShowPop] = useState(false);
  const maxBalloonSize = 200;

  // Player Join game
  const handleJoin = async () => {
    if (!playerName.trim()) {
      message.error("Please enter your name");
      return;
    }
    setLoading(true);
    try {
      const res = await api.post(`/play/join/${sessionId}`, {
        name: playerName,
      });

      if (res && res.playerId) {
        setPlayerId(res.playerId);
        setJoined(true);
        message.success("Successfully joined the game!");
        startPolling(res.playerId);
      }
    } catch (_error) {
      message.error("Failed to join the game");
    } finally {
      setLoading(false);
    }
  };
  //Check Correct An
  const fetchcorrectAnswer = async () => {
    try {
      if (!playerId || !currentQuestion) return;
      const answerRes = await api.get(`/play/${playerId}/answer`);
      console.log("🔍 Answer Response:", answerRes);
      if (answerRes && Array.isArray(answerRes.answers)) {
        setCurrentQuestion((prev) => ({
          ...prev,
          correctAnswers: answerRes.answers,
        }));
      } else {
        console.warn("Invalid answer format received:", answerRes);
      }
    } catch (_error) {
      console.error(
        "Error fetching correct answers from /play/:playerId/answer"
      );
    }
  };
  //Game Status
  const checkGameStatu = async (playerId) => {
    try {
      const statusResponse = await api.get(`/play/${playerId}/status`);
      if (statusResponse && statusResponse.started) {
        setGameStarted(true);
        await fetchQues(playerId);
      }
    } catch (_error) {
      if (_error.message === "Session ID is not an active session") {
        setGameOver(true);
      } else {
        console.error("Error checking game status:");
      }
    }
  };
  //to result when history done
  useEffect(() => {
    if (gameOver && history.length > 0 && playerId) {
      const total = history.length;
      const correctCount = history.filter((q) => q.isCorrect).length;
      const totalScore = history.reduce((sum, q) => sum + q.score, 0);

      nav(`/play/${playerId}/result`, {
        state: {
          playerName,
          total,
          correctCount,
          answeredCount: history.length,
          totalScore,
          details: history.map((q) => ({
            score: q.score,
            correct: q.isCorrect,
            question: q.question,
          })),
        },
      });
    }
  }, [gameOver, history, playerId, playerName, nav]);
  //Fetch Questions
  const fetchQues = async (playerId) => {
    try {
      const questionResponse = await api.get(`/play/${playerId}/question`);
      if (questionResponse && questionResponse.question) {
        const newQuestionId = questionResponse.question.id;
        if (
          !currentQuestionRef.current ||
          currentQuestionRef.current !== newQuestionId
        ) {
          currentQuestionRef.current = newQuestionId;
          setCurrentQuestion(questionResponse.question);
          setSelectedAnswers([]);
          setAnswered(false);
          setShowAnswer(false);
          setSubmitting(false);
        }
      }
    } catch (_error) {
      console.error("Error polling game status:");
    }
  };
  //Select An
  const handleAnswer = async () => {
    if (!playerId || selectedAnswers.length === 0 || answered || submitting)
      return;
    setSubmitting(true);
    const submitTime = new Date().toISOString();
    const answerIndices = selectedAnswers
      .map((selected) => {
        if (
          currentQuestion.answers &&
          currentQuestion.answers.length > 0 &&
          typeof currentQuestion.answers[0] === "object" &&
          "answer" in currentQuestion.answers[0]
        ) {
          return currentQuestion.answers.findIndex(
            (a) => a.answer === selected
          );
        } else {
          return currentQuestion.answers.indexOf(selected);
        }
      })
      .filter((index) => index !== -1);
    if (answerIndices.length === 0) {
      console.error("No valid answer indices found");
      setSubmitting(false);
      return;
    }
    const answerPayLoad = {
      questionStartedAt: currentQuestion.isoTimeLastQuestionStarted || null,
      answeredAt: submitTime,
      answers: answerIndices,
      correct: null,
    };
    console.log("📤 Sending data to backend:", answerPayLoad);
    try {
      await api.put(`/play/${playerId}/answer`, answerPayLoad);
      message.success("Answer submitted!");
      setAnswered(true);
    } catch (_error) {
      console.error("Failed to submit answer:", _error);
      message.error("Failed to submit answer");
    } finally {
      setSubmitting(false);
    }
  };
  //polling start
  const startPolling = (playerId) => {
    if (pollingRef.current) {
      clearInterval(pollingRef.current);
    }
    checkGameStatu(playerId);
    pollingRef.current = setInterval(() => checkGameStatu(playerId), 2000);
  };
  //Set Timer
  useEffect(() => {
    if (currentQuestion && gameStarted && !showAnswer) {
      setTimeLeft(currentQuestion.duration || 30);
      setSubmitting(false);
      if (timerId.current) clearInterval(timerId.current);
      timerId.current = setInterval(() => {
        setTimeLeft((prev) => {
          if (prev <= 1) {
            clearInterval(timerId.current);
            setShowAnswer(true);
            fetchcorrectAnswer();

            if (selectedAnswers.length === 0) {
              setResult(false);
            }
            return 0;
          }
          return prev - 1;
        });
      }, 1000);
    }
  }, [currentQuestion?.id, gameStarted, showAnswer]);
  //clear intervals
  useEffect(() => {
    return () => {
      if (timerId.current) {
        clearInterval(timerId.current);
      }
      if (pollingRef.current) {
        clearInterval(pollingRef.current);
      }
    };
  }, []);
  //result correct or in correct
  useEffect(() => {
    if (!showAnswer || !currentQuestion?.correctAnswers) return;
    console.log("Current question data:", currentQuestion);
    let correctAn = [];
    if (
      currentQuestion.answers &&
      currentQuestion.answers.length > 0 &&
      typeof currentQuestion.answers[0] === "object" &&
      "isCorrect" in currentQuestion.answers[0]
    ) {
      correctAn = currentQuestion.answers
        .filter((answer) => answer.isCorrect)
        .map((answer) => answer.answer);
    } else if (
      Array.isArray(currentQuestion.correctAnswers) &&
      currentQuestion.correctAnswers.every((index) => typeof index === "number")
    ) {
      correctAn = currentQuestion.correctAnswers.map((index) => {
        return typeof currentQuestion.answers[index] === "object"
          ? currentQuestion.answers[index].answer
          : currentQuestion.answers[index];
      });
    } else {
      correctAn = currentQuestion.answers.filter(
        (_, index) => currentQuestion.correctAnswers[index]
      );
    }
    const isEqualArray = (a, b) => {
      if (a.length !== b.length) return false;
      const setA = new Set(a);
      const setB = new Set(b);
      for (const item of setA) {
        if (!setB.has(item)) return false;
      }
      return true;
    };
    const bothSame = isEqualArray(selectedAnswers, correctAn);
    setResult(bothSame);
    const questionScore = currentQuestion.score || 0;
    setHistory((prev) => [
      ...prev,
      {
        questionId: currentQuestion.id,
        question: currentQuestion.question,
        selected: [...selectedAnswers],
        correct: correctAn,
        isCorrect: bothSame,
        score: questionScore,
      },
    ]);
  }, [showAnswer, currentQuestion?.correctAnswers, selectedAnswers]);
  //Show option
  const rangeanswers = () => {
    if (!currentQuestion.answers) return null;
    return currentQuestion.answers.map((item, index) => {
      const answerText =
        typeof item === "object" && "answer" in item ? item.answer : item;
      const selectEd = selectedAnswers.includes(answerText);
      let isCorrect = false;
      if (showAnswer) {
        if (typeof item === "object" && "isCorrect" in item) {
          isCorrect = item.isCorrect;
        } else if (Array.isArray(currentQuestion.correctAnswers)) {
          if (
            currentQuestion.correctAnswers.every((i) => typeof i === "number")
          ) {
            isCorrect = currentQuestion.correctAnswers.includes(index);
          } else {
            isCorrect = currentQuestion.correctAnswers[index];
          }
        }
      }

      return (
        <Button
          key={index}
          block
          type={
            showAnswer && isCorrect
              ? "primary"
              : selectEd
                ? "primary"
                : "default"
          }
          onClick={() => {
            if (showAnswer || answered) return;
            let newAnswers;
            if (
              currentQuestion.type === "Single Choice" ||
              currentQuestion.type === "Judgment"
            ) {
              newAnswers = [answerText];
            } else {
              if (selectedAnswers.includes(answerText)) {
                newAnswers = selectedAnswers.filter(
                  (ans) => ans !== answerText
                );
              } else {
                newAnswers = [...selectedAnswers, answerText];
              }
            }
            setSelectedAnswers(newAnswers);
          }}
          disabled={showAnswer || answered || submitting}
        >
          {answerText}
        </Button>
      );
    });
  };
  //minigame
  const handleBalloonClick = () => {
    if (showPop) return;
    const newSize = balloonSize + 10;
    setBalloonSize(newSize);
    //pop
    if (newSize >= maxBalloonSize) {
      setShowPop(true);
      setPopMessage("POP!");
      //reset
      setTimeout(() => {
        setBalloonSize(50);
        setShowPop(false);
      }, 2000);
    }
  };
  //entergame
  if (!joined) {
    return (
      <div style={{ padding: "24px", maxWidth: "500px", margin: "0 auto" }}>
        <BackgroundLogo />
        <Card>
          <Title level={2}>Join Game</Title>
          <Space direction="vertical" size="large" style={{ width: "100%" }}>
            <Input
              prefix={<UserOutlined />}
              placeholder="Enter your name"
              value={playerName}
              onChange={(e) => {
                const value = e.target.value;
                setPlayerName(value);
              }}
              onPressEnter={() => {
                if (playerName.trim()) {
                  handleJoin();
                } else {
                  message.error("Name cannot be empty or only spaces");
                }
              }}
              disabled={loading}
              status={
                playerName === "" ? "" : playerName.trim() === "" ? "error" : ""
              }
            />
            <Button type="primary" onClick={handleJoin} loading={loading} block>
              Join Game
            </Button>
          </Space>
        </Card>
      </div>
    );
  }

  if (loading) {
    return (
      <div style={{ padding: "24px", textAlign: "center" }}>
        <BackgroundLogo />
        <Spin size="large" />
        <Typography.Text>Loading...</Typography.Text>
      </div>
    );
  }
  //lobby game
  if (!gameStarted) {
    return (
      <div style={{ padding: "24px", textAlign: "center" }}>
        <BackgroundLogo />
        <Title level={3}>Waiting for the game to start...</Title>
        {/* minigame */}
        <div style={{ marginTop: "40px", position: "relative" }}>
          <Text>Click the balloon to inflate it!</Text>
          <div
            style={{
              margin: "20px auto",
              height: "300px",
              position: "relative",
              display: "flex",
              justifyContent: "center",
              alignItems: "center",
            }}
          >
            {showPop ? (
              <div
                style={{
                  position: "absolute",
                  fontSize: "60px",
                  fontWeight: "bold",
                  color: "#ff5252",
                  animation: "popAnimation 0.5s ease-out",
                }}
              >
                {popMessage}
              </div>
            ) : (
              <img
                src="/balloon.svg"
                alt="Balloon"
                onClick={handleBalloonClick}
                style={{
                  width: `${balloonSize}px`,
                  height: `${balloonSize * 1.2}px`,
                  cursor: "pointer",
                  transition: "all 0.1s ease-out",
                }}
              />
            )}
          </div>
          <Text type="secondary">Be careful not to pop it!</Text>
        </div>
        <style>
          {`
            @keyframes popAnimation {
              0% { transform: scale(0.5); opacity: 0.8; }
              50% { transform: scale(2); opacity: 1; }
              100% { transform: scale(1.5); opacity: 0; }
            }
          `}
        </style>
      </div>
    );
  }

  if (!currentQuestion) {
    return (
      <div style={{ padding: "24px", textAlign: "center" }}>
        <BackgroundLogo />
        <Title level={3}>Waiting for the next question...</Title>
      </div>
    );
  }

  return (
    <div style={{ padding: "24px", maxWidth: "800px", margin: "0 auto" }}>
      <BackgroundLogo />
      <Card>
        <div style={{ marginBottom: "16px" }}>
          <Progress
            percent={(timeLeft / (currentQuestion.duration || 30)) * 100}
            status={timeLeft < 5 ? "exception" : "active"}
            format={() => `${timeLeft}s`}
          />
        </div>
        <div style={{ marginBottom: "8px" }}>
          <Typography.Text type="secondary" style={{ fontSize: "14px" }}>
            Question Type Is: {currentQuestion.type}
            <br />
            <span style={{ color: "red" }}>Must Submit!</span>
          </Typography.Text>
          <Title level={3} style={{ marginTop: "4px" }}>
            {currentQuestion.question}
          </Title>
        </div>

        {currentQuestion.image && (
          <img
            src={currentQuestion.image}
            alt="Question"
            style={{ maxWidth: "100%", marginBottom: "16px" }}
          />
        )}
        <Space direction="vertical" size="large" style={{ width: "100%" }}>
          {currentQuestion.answers && rangeanswers()}

          {!showAnswer && !answered && selectedAnswers.length > 0 && (
            <Button
              type="primary"
              block
              onClick={handleAnswer}
              loading={submitting}
              disabled={submitting}
              style={{ marginTop: "16px" }}
            >
              Submit Answer
            </Button>
          )}
        </Space>
        {showAnswer && (
          <>
            <div
              style={{
                marginTop: "16px",
                padding: "16px",
                background: "#f5f5f5",
              }}
            >
              <Title level={4}>
                Correct Answer:{" "}
                {currentQuestion.answers
                  .map((item) => {
                    const answerText =
                      typeof item === "object" && "answer" in item
                        ? item.answer
                        : item;
                    const isCorrect =
                      typeof item === "object" && "isCorrect" in item
                        ? item.isCorrect
                        : Array.isArray(currentQuestion.correctAnswers) &&
                          typeof currentQuestion.correctAnswers[0] === "number"
                          ? currentQuestion.correctAnswers.includes(
                            currentQuestion.answers.indexOf(item)
                          )
                          : currentQuestion.correctAnswers?.[
                            currentQuestion.answers.indexOf(item)
                          ];

                    return isCorrect ? answerText : null;
                  })
                  .filter(Boolean)
                  .join(", ")}
              </Title>
            </div>
            <div
              style={{
                marginTop: "16px",
                padding: "16px",
                background: "#f0f0f0",
              }}
            >
              <Title level={4}>Your Answer: {selectedAnswers.join(", ")}</Title>
            </div>
            <div
              style={{
                marginTop: "16px",
                padding: "12px",
                textAlign: "center",
              }}
            >
              {/*show result*/}
              {result === true && (
                <Typography.Title level={3} type="success">
                  Correct!
                </Typography.Title>
              )}
              {result === false && (
                <Typography.Title level={3} type="danger">
                  Incorrect
                </Typography.Title>
              )}
            </div>
          </>
        )}
      </Card>
    </div>
  );
};

export default PlayerGame;
