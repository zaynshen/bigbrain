import { useEffect, useState } from "react";
import { useParams, useNavigate } from "react-router-dom";
import api from "../../components/fetch";
import AppBar from "@mui/material/AppBar";
import Toolbar from "@mui/material/Toolbar";
import Box from "@mui/material/Box";
import Container from "@mui/material/Container";
import { Content } from "antd/es/layout/layout";
import {
  Form,
  Input,
  Modal,
  Button,
  Typography,
  message,
  Select,
  Card,
  Empty,
  Popconfirm,
} from "antd";
import {
  DeleteOutlined,
  QuestionCircleOutlined,
  ArrowLeftOutlined,
  SettingOutlined,
} from "@ant-design/icons";
import { getUserEmail, isLogin, generateQId } from "../../components";
import BackgroundLogo from "../../components/Background";
const { Meta } = Card;

const Gamepage = () => {
  const { game_id } = useParams();
  const [games, setGames] = useState([]);
  const [questions, setQuestions] = useState([]);
  const [currentGame, setcurrentGame] = useState(null);
  const [open, setOpen] = useState(false);
  const [form] = Form.useForm();
  const nav = useNavigate();
  const { Option } = Select;
  // fetchQ
  const fetchQuestions = async () => {
    try {
      const data = await api.get("/admin/games");
      if (data && Array.isArray(data.games)) {
        setGames(data.games);
        const goalGame = data.games.find(
          (game) => game.id === parseInt(game_id)
        );

        if (goalGame) {
          setcurrentGame(goalGame);
          setQuestions(goalGame.questions || []);
        } else {
          message.error("Game not Found");
          nav("/dashboard");
        }
      }
    } catch (_error) {
      message.error("Get data fild");
    }
  };
  //Create Q
  const handleCreateQuestion = async (values) => {
    try {
      const newQuestion = {
        id: generateQId(),
        question: values.question,
        type: values.type,
        createBy: getUserEmail(),
      };
      const updatedGames = games.map((g) => {
        if (g.id === currentGame.id) {
          return {
            ...g,
            questions: [...(g.questions || []), newQuestion],
          };
        }
        return g;
      });
      await api.put("/admin/games", { games: updatedGames });
      message.success("Question created!");
      form.resetFields();
      setOpen(false);
      await fetchQuestions();
    } catch (_error) {
      message.error("Create question failed.");
    }
  };
  //Delete Q
  const handleDelete = async (questionId) => {
    try {
      const updatedQuestions = (currentGame.questions || []).filter(
        (q) => q.id !== questionId
      );
      const updateGame = {
        ...currentGame,
        questions: updatedQuestions,
      };
      const updateGames = games.map((g) =>
        g.id === currentGame.id ? updateGame : g
      );
      await api.put("/admin/games", { games: updateGames });
      message.success("Question Deleted Successfully!");
      setQuestions(updatedQuestions);
      setcurrentGame(updateGame);
      setGames(updateGames);
    } catch (_error) {
      message.error("Question Deleted Failed!");
    }
  };
  //Seting Q
  const handleSettingClick = (question) => {
    nav(`/game/${game_id}/question/${question.id}`, {
      state: {
        question: question.question,
        type: question.type,
        answers: question.answers || [],
        correctAnswers: question.correctAnswers || [],
        score: question.score || 0,
        duration: question.duration || 0,
      },
    });
  };
  const handleOk = async () => {
    try {
      const values = await form.validateFields();
      await handleCreateQuestion(values);
    } catch {
      message.error("Please complete the form.");
    }
  };
  useEffect(() => {
    const logged = isLogin();
    if (!logged) {
      message.warning("Please login first", 0.3, () => nav("/login"));
    } else {
      fetchQuestions();
    }
  }, []);
  useEffect(() => {
    const handleFocus = () => {
      fetchQuestions();
    };
    window.addEventListener("focus", handleFocus);
    return () => window.removeEventListener("focus", handleFocus);
  }, []);

  return (
    <div>
      <AppBar position="static" sx={{ backgroundColor: "#ff9434" }}>
        <Container maxWidth="xl">
          <Toolbar sx={{ display: "flex", justifyContent: "space-between" }}>
            <Box sx={{ display: "flex", alignItems: "center", gap: 2 }}>
              <Button
                type="text"
                icon={<ArrowLeftOutlined />}
                onClick={() => nav("/dashboard")}
                style={{ color: "#af1441" }}
              >
                Back
              </Button>
              <img
                src="/logo.png"
                alt="logo"
                style={{ height: 40, marginRight: 10 }}
              />
              <Typography.Title
                level={3}
                style={{ margin: 0, color: "#af1441" }}
              >
                Game: {currentGame?.name}
              </Typography.Title>
            </Box>
            <Box sx={{ display: "flex", alignItems: "center", gap: 3 }}>
              <Button
                color="default"
                variant="text"
                onClick={() => setOpen(true)}
                style={{ color: "#fff" }}
              >
                Add Question
              </Button>
              <Modal
                title="Add New Question"
                open={open}
                onOk={handleOk}
                onCancel={() => setOpen(false)}
                okText="Submit"
              >
                <Form form={form} layout="vertical">
                  <Form.Item
                    name="question"
                    label="Question Text"
                    rules={[
                      { required: true, message: "Please enter question text" },
                      {
                        validator: (_, value) => {
                          if (!value || value.trim() === "") {
                            return Promise.reject(
                              "Title cannot be empty or only spaces"
                            );
                          }
                          return Promise.resolve();
                        },
                      },
                    ]}
                  >
                    <Input.TextArea
                      data-cy="add-question-input"
                      placeholder="Type the question here"
                    />
                  </Form.Item>

                  <Form.Item
                    name="type"
                    label="Type"
                    rules={[
                      {
                        required: true,
                        message: "Please select Question Type!",
                      },
                    ]}
                  >
                    <Select placeholder="select your Question Type">
                      <Option value="Single Choice">
                        Single Choice Question
                      </Option>
                      <Option value="Multiple Selection">
                        Multiple Selection Question
                      </Option>
                      <Option value="Judgment">Judgment Question</Option>
                    </Select>
                  </Form.Item>
                </Form>
              </Modal>
            </Box>
          </Toolbar>
        </Container>
      </AppBar>
      <Content style={{ padding: 24 }}>
        <div
          style={{
            position: "relative",
            padding: "20px",
          }}
        >
          <BackgroundLogo />
          <Typography.Title level={4}>Questions</Typography.Title>

          <Container
            style={{
              display: "flex",
              flexWrap: "wrap",
              gap: "20px",
              paddingTop: "20px",
            }}
          >
            {questions.length > 0 ? (
              questions.map((q, index) => (
                <Card
                  key={q.id}
                  style={{ width: 300 }}
                  actions={[
                    <SettingOutlined
                      key="setting"
                      onClick={() => handleSettingClick(q)}
                    />,
                    <Popconfirm
                      key="delete"
                      title="Delete This Question"
                      description="Are you sure to delete this question?"
                      icon={<QuestionCircleOutlined style={{ color: "red" }} />}
                      onConfirm={() => handleDelete(q.id)}
                      onCancel={() => {}}
                      okText="Yes"
                      cancelText="No"
                    >
                      <DeleteOutlined />
                    </Popconfirm>,
                  ]}
                >
                  <Meta
                    title={`Question${index + 1}: ${q.question}`}
                    description={
                      <div>
                        <div>Type: {q.type}</div>
                        <div>Score: {q.score || 0}</div>
                        <div>Time Limit: {q.duration || 0} seconds</div>
                        <div>
                          answers: {q.optionCount || q.answers?.length || 0}
                        </div>
                      </div>
                    }
                  />
                </Card>
              ))
            ) : (
              <Empty description="No questions yet." />
            )}
          </Container>
        </div>
      </Content>
    </div>
  );
};

export default Gamepage;
