import { useNavigate, Link } from "react-router-dom";
import { Form, Input, Button, message } from "antd";
import api from "../../components/fetch";
import BackgroundLogo from "../../components/Background";
import { useEffect } from "react";

const Login = () => {
  const navigate = useNavigate();
  //click submit
  const loginSubmit = (values) => {
    const { email, password } = values;
    const data = {
      email,
      password,
    };
    api.post("/admin/auth/login", data).then((res) => {
      if (res && res.token) {
        localStorage.setItem("token", res.token);
        localStorage.setItem("email", values.email);
        console.log("Login response:", res);
        message.success("Login Success!");
        navigate("/Dashboard");
      }
    });
  };
  //if Faild
  const loginformFailed = (_errorInfo) => {
    message.error("Login failed. Please check your credentials.");
  };

  return (
    <div
      style={{
        position: "relative",
        overflow: "hidden",
        height: "100vh",
        display: "flex",
        justifyContent: "center",
        alignItems: "center",
        flexDirection: "column",
        padding: "2rem",
        backgroundColor: "#fdfdfd",
      }}
    >
      <BackgroundLogo />
      <div
        style={{
          zIndex: 1,
          background: "rgba(255, 255, 255, 0.9)",
          padding: "2rem",
          borderRadius: "12px",
          boxShadow: "0 0 10px rgba(0,0,0,0.1)",
        }}
      >
        <div style={{ textAlign: "center", marginBottom: "1.5rem" }}>
          <h2 style={{ margin: 0 }}>Login to BigBrain</h2>
        </div>
        <Form
          name="login-form"
          labelCol={{ span: 8 }}
          wrapperCol={{ span: 16 }}
          style={{ maxWidth: 600 }}
          initialValues={{ remember: true }}
          onFinish={loginSubmit}
          onFinishFailed={loginformFailed}
          autoComplete="off"
        >
          <Form.Item
            label="Email"
            name="email"
            rules={[{ required: true, message: "Please input your Email!" }]}
          >
            <Input />
          </Form.Item>

          <Form.Item
            label="Password"
            name="password"
            rules={[{ required: true, message: "Please input your password!" }]}
          >
            <Input.Password />
          </Form.Item>

          <Form.Item label={null}>
            <Button type="primary" htmlType="submit">
              Login
            </Button>
          </Form.Item>

          <Form.Item
            wrapperCol={{ offset: 0, span: 24 }}
            style={{ textAlign: "center" }}
          >
            <span>No account? </span>
            <Link to="/register">Register now</Link>
          </Form.Item>
        </Form>
      </div>
    </div>
  );
};
export default Login;
