import { useNavigate, Link } from "react-router-dom";
import { Form, Input, Button, message } from "antd";
import api from "../../components/fetch";
import BackgroundLogo from "../../components/Background";
import { useEffect } from "react";

const Register = () => {
  const [form] = Form.useForm();
  const navigate = useNavigate();
  useEffect(() => {
    localStorage.removeItem("token");
    localStorage.removeItem("email");
  }, []);
  //submit form
  const submitFinish = (values) => {
    const { name, email, password } = values;
    const data = {
      name,
      email,
      password,
    };
    api.post("/admin/auth/register", data).then((res) => {
      if (res && res.token) {
        localStorage.setItem("token", res.token);
        localStorage.setItem("email", email);
        message.success("Register Success!");
        navigate("/Dashboard");
      }
    });
  };
  //if faild
  const formFailed = (_errorInfo) => {
    message.error("Registration failed. Please check your input.");
  };

  return (
    <div
      style={{
        height: "100vh",
        display: "flex",
        justifyContent: "center",
        alignItems: "center",
        flexDirection: "column",
        padding: "2rem",
      }}
    >
      <BackgroundLogo />
      <div style={{ textAlign: "center", marginBottom: "1.5rem" }}>
        <img
          src="/logo.png"
          alt="logo"
          style={{ width: "60px", marginBottom: "0.5rem" }}
        />
        <h2 style={{ margin: 0 }}>BigBrain Register</h2>
      </div>
      <Form
        form={form}
        name="register-form"
        labelCol={{ span: 10 }}
        wrapperCol={{ span: 16 }}
        style={{ maxWidth: 600 }}
        onFinish={submitFinish}
        onFinishFailed={formFailed}
        autoComplete="off"
      >
        <Form.Item
          label="Email"
          name="email"
          rules={[
            { required: true, message: "Please Enter the Email!" },
            { type: "email", message: "Email is invalied!" },
          ]}
        >
          <Input />
        </Form.Item>

        <Form.Item
          label="Name"
          name="name"
          rules={[
            { required: true, message: "Please Enter Name!" },
            {
              validator: (_, value) => {
                if (!value || value.trim() === "") {
                  return Promise.reject("Title cannot be empty or only spaces");
                }
                return Promise.resolve();
              },
            },
          ]}
        >
          <Input />
        </Form.Item>

        <Form.Item
          label="Password"
          name="password"
          rules={[
            { required: true, message: "Please Enter Password!" },
            {
              validator: (_, value) => {
                if (value && value.includes(" ")) {
                  return Promise.reject("Password cannot contain spaces");
                }
                return Promise.resolve();
              },
            },
          ]}
          hasFeedback
        >
          <Input.Password />
        </Form.Item>

        <Form.Item
          label="Confirm Password"
          name="confirmPassword"
          dependencies={["password"]}
          hasFeedback
          rules={[
            { required: true, message: "Please Enter Password!" },
            ({ getFieldValue }) => ({
              validator(_, value) {
                if (!value || getFieldValue("password") === value) {
                  return Promise.resolve();
                }
                return Promise.reject(new Error("Passwords do not match!"));
              },
            }),
          ]}
        >
          <Input.Password />
        </Form.Item>

        <Form.Item wrapperCol={{ offset: 8, span: 16 }}>
          <Button type="primary" htmlType="submit">
            Register
          </Button>
        </Form.Item>
        <Form.Item
          wrapperCol={{ offset: 0, span: 24 }}
          style={{ textAlign: "center" }}
        >
          <span>Already have an account?</span>{" "}
          <Link to="/login">Login Now!</Link>
        </Form.Item>
      </Form>
    </div>
  );
};
export default Register;
