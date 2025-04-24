import {
  Avatar,
  Dropdown,
  Space,
  Form,
  Input,
  Upload,
  Modal,
  Button,
  Typography,
  message,
} from "antd";
import { DownOutlined, LogoutOutlined, PlusOutlined } from "@ant-design/icons";
import { useNavigate } from "react-router-dom";
import api from "../../components/fetch";
import { useEffect, useState } from "react";
import {
  getUserEmail,
  isLogin,
  fileToDataUrl,
  generateId,
} from "../../components";
import AppBar from "@mui/material/AppBar";
import Toolbar from "@mui/material/Toolbar";
import Box from "@mui/material/Box";
import Container from "@mui/material/Container";
import { Content } from "antd/es/layout/layout";
import CardGird from "../../components/cardgird";
import BackgroundLogo from "../../components/Background";

const Dashboard = () => {
  const nav = useNavigate();
  const [open, setOpen] = useState(false);
  const [form] = Form.useForm();
  const [games, setGames] = useState([]);
  const [fileList, setfileList] = useState([]);
  const [thumbnailbase64, setThumbnailBase64] = useState("");

  const handleOk = async () => {
    try {
      const values = await form.validateFields();
      await handleCreateGame(values);
    } catch (_error) {
      message.error("Failed to create game.");
    }
  };
  //click logout
  const handleLogout = () => {
    api.post("/admin/auth/logout").then((res) => {
      if (res) {
        localStorage.removeItem("token");
        localStorage.removeItem("email");
        message.success("Logout Successfully!", 0.3, () => {
          nav("/login");
        });
      }
    });
  };
  //upload file
  const handleUpload = async (file) => {
    try {
      const base64 = await fileToDataUrl(file);
      setThumbnailBase64(base64);
      setfileList([
        {
          uid: "-1",
          name: file.name,
          status: "done",
          url: base64,
        },
      ]);
      form.setFieldsValue("thumbnail", base64);
    } catch (_error) {
      message.error(
        "Invalid file type. Please upload a png, jpg or jpeg image."
      );
    }
    return false;
  };
  //Fetch Games
  const fetchGames = async () => {
    try {
      const res = await api.get("/admin/games");
      if (res && res.games) {
        setGames(res.games);
      }
    } catch (_error) {
      message.error("Fetch games failed!");
    }
  };
  //Create Game
  const handleCreateGame = async (values) => {
    const gameId = generateId();
    const newGame = {
      id: gameId,
      name: values.title,
      description: values.description,
      thumbnail: thumbnailbase64,
      owner: getUserEmail(),
      createdAt: new Date().toISOString(),
      questions: [],
    };
    console.log("Game newGame to be sent:", newGame);
    try {
      //Get games
      const curRes = await api.get("/admin/games");
      const curGames = curRes?.games || [];
      const gameData = {
        games: [...curGames, newGame],
      };
      const res = await api.put("/admin/games", gameData);
      if (res) {
        message.success("Game Created Successfully!");
        form.resetFields();
        setfileList([]);
        setThumbnailBase64("");
        setOpen(false);
        fetchGames();
      }
    } catch (_error) {
      message.error("Game Created Failed!");
    }
  };
  //Delete Game
  const handleDelete = (gameId) => {
    const newGame = games.filter((game) => game.id !== gameId);
    api
      .put("/admin/games", { games: newGame })
      .then((res) => {
        if (res) {
          message.success("Game Deleted Successfully!");
          fetchGames();
        }
      })
      .catch((_error) => {
        message.error("Game Deleted Failed!");
      });
  };
  //dropdown
  const menuItem = [
    {
      key: "logout",
      label: <span onClick={handleLogout}>Logout</span>,
      icon: <LogoutOutlined />,
    },
  ];
  //getgame
  useEffect(() => {
    const logined = isLogin();
    api.get("/admin/games").then((_data) => {
      if (!logined) {
        message.warning("Please Login First!", 0.3, () => {
          nav("/login");
        });
      } else {
        fetchGames();
      }
    });
  }, []);
  return (
    <div>
      <AppBar position="static" sx={{ backgroundColor: "#ff9434" }}>
        <Container maxWidth="xl">
          <Toolbar sx={{ display: "flex", justifyContent: "space-between" }}>
            <Box sx={{ display: "flex", alignItems: "center" }}>
              <img
                src="/logo.png"
                alt="logo"
                style={{ height: 40, marginRight: 10 }}
              />
              <Typography.Title
                level={3}
                style={{
                  textAlign: "center",
                  fontSize: "24px",
                  margin: 0,
                  color: "#af1441",
                }}
              >
                BigBrain
              </Typography.Title>
            </Box>
            <Box sx={{ display: "flex", alignItems: "center", gap: 3 }}>
              <Button
                color="default"
                variant="text"
                onClick={() => setOpen(true)}
                style={{ color: "#fff" }}
              >
                Create Game
              </Button>
              <Modal
                title="Create New Game"
                open={open}
                onOk={handleOk}
                onCancel={() => setOpen(false)}
                okText="Submit"
              >
                <Form form={form} layout="vertical">
                  <Form.Item name="thumbnail" label="Thumbnail">
                    <Upload
                      listType="picture-card"
                      fileList={fileList}
                      beforeUpload={handleUpload}
                      onRemove={() => {
                        setfileList([]);
                        form.setFieldsValue({ thumbnail: "" });
                      }}
                      showUploadList={{ showPreviewIcon: false }}
                    >
                      {fileList.length >= 1 ? null : (
                        <div>
                          <PlusOutlined />
                          <div style={{ marginTop: 8 }}>Upload</div>
                        </div>
                      )}
                    </Upload>
                  </Form.Item>

                  <Form.Item
                    name="title"
                    label="Game Title"
                    rules={[
                      { required: true, message: "Please input game title!" },
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
                    <Input placeholder="Enter game title" />
                  </Form.Item>

                  <Form.Item name="description" label="Description">
                    <Input.TextArea
                      rows={3}
                      placeholder="Enter description..."
                    />
                  </Form.Item>
                </Form>
              </Modal>

              <Dropdown
                menu={{ items: menuItem }}
                placement="bottomRight"
                arrow
              >
                <Space style={{ cursor: "pointer" }} data-cy="user-dropdown">
                  <Avatar>{getUserEmail()?.[0] || "U"}</Avatar>
                  <DownOutlined style={{ color: "#fff" }} />
                </Space>
              </Dropdown>
            </Box>
          </Toolbar>
        </Container>
      </AppBar>
      <Content
        style={{
          position: "relative",

          padding: "20px",
        }}
      >
        <BackgroundLogo />
        <CardGird games={games} onDelete={handleDelete} />
      </Content>
    </div>
  );
};
export default Dashboard;
