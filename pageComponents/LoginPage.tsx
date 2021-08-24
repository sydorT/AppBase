import * as React from "react";
import "./Login.css";
import { ErrorMessages, PasswordField } from "../components";
import { LoginResponseInterface, UserContextInterface, ChurchInterface } from "../interfaces";
import { ApiHelper, ArrayHelper, UserHelper } from "../helpers";
import { Button, FormControl, Alert, Form } from "react-bootstrap";
import { Redirect, useLocation } from "react-router-dom";
import { useCookies } from "react-cookie"
import * as yup from "yup"
import { Formik, FormikHelpers } from "formik"
import { Register } from "./components/Register"
import { SelectChurchModal } from "./components/SelectChurchModal"
import { PersonInterface, UserChurchInterface } from "../interfaces"

const schema = yup.object().shape({
  email: yup.string().required("Please enter your email address.").email("Please enter a valid email address."),
  password: yup.string().required("Please enter your password.")
})

interface Props {
  accessApi?: string,
  context: UserContextInterface,
  jwt: string, auth: string,
  successCallback?: () => void,
  requiredKeyName?: boolean,
  logo?: string,
  appName?: string,
  appUrl?: string,
  performGuestLogin?: (loginResponse: LoginResponseInterface) => void;
  allowRegister?: boolean
}

export const LoginPage: React.FC<Props> = (props) => {
  const [welcomeBackName, setWelcomeBackName] = React.useState("");
  const [errors, setErrors] = React.useState([]);
  const [redirectTo, setRedirectTo] = React.useState<string>("");
  const [cookies, setCookie] = useCookies(["jwt", "name", "email"]);
  const location = useLocation();
  const [showRegister, setShowRegister] = React.useState(false);
  const [showSelectModal, setShowSelectModal] = React.useState(false);
  const [loginResponse, setLoginResponse] = React.useState<LoginResponseInterface>(null)
  const [userJwt, setUserJwt] = React.useState("")
  var selectedChurchId = "";

  const init = () => {
    if (props.auth) login({ authGuid: props.auth });
    if (props.jwt) {
      setWelcomeBackName(cookies.name);
      login({ jwt: props.jwt });
    }
  };

  const handleLoginSuccess = async (resp: LoginResponseInterface) => {
    //let churches: ChurchInterface[] = [];
    setUserJwt(resp.user.jwt);
    ApiHelper.setDefaultPermissions(resp.user.jwt);
    setLoginResponse(resp)
    resp.churches.forEach(church => {
      if (!church.apis) church.apis = [];
    });
    /*
    resp.churches.forEach(church => {
      if (church.apps.some(c => c.appName === props.appName)) {
        churches.push(church)
      }
    })*/;
    UserHelper.churches = resp.churches;

    setCookie("name", `${resp.user.firstName} ${resp.user.lastName}`, { path: "/" });
    setCookie("email", resp.user.email, { path: "/" });
    UserHelper.user = resp.user;

    if (selectedChurchId) {
      await UserHelper.selectChurch(props.context, selectedChurchId, undefined);
      continuedLoginProcess();
      return;
    }
    else if (props.requiredKeyName) {
      const keyName = window.location.hostname.split(".")[0];
      await UserHelper.selectChurch(props.context, undefined, keyName);
      continuedLoginProcess()
      return
    }
    setShowSelectModal(true);
  }

  function continuedLoginProcess() {
    /**
     * if user doesn't belong to the church but still wants to log in to that church.
     * We allow them to log in as "Guest", this feature is only supported
     * for "streamingLive" app.
     */
    if (props.performGuestLogin && !UserHelper.currentChurch) {
      props.performGuestLogin(loginResponse);
      return;
    }



    /*
    const hasAccess = UserHelper.currentChurch?.apps.some((app => app.appName === props.appName));
    if (!hasAccess) {
      handleLoginErrors(["No permissions"]);
      return;
    }*/

    // App has access so lets cookie selected church's access API JWT.
    if (UserHelper.currentChurch) {
      UserHelper.currentChurch.apis.forEach(api => {
        if (api.keyName === "AccessApi") setCookie("jwt", api.jwt, { path: "/" });
      })
    }

    const search = new URLSearchParams(location.search);
    const returnUrl = search.get("returnUrl");
    if (returnUrl) {
      setRedirectTo(returnUrl);
    }

    if (props.successCallback !== undefined) props.successCallback();
    else props.context.setUserName(UserHelper.currentChurch.id.toString());
  }

  async function selectChurch(churchId: string) {
    selectedChurchId = churchId;
    if (!ArrayHelper.getOne(UserHelper.churches, "id", churchId)) {
      const church: ChurchInterface = await ApiHelper.post("/churches/select", { churchId: churchId }, "AccessApi");
      UserHelper.setupApiHelper(church);

      //create/claim the person record and relogin
      const personClaim = await ApiHelper.get("/people/claim/" + churchId, "MembershipApi");
      await ApiHelper.post("/userChurch/claim", { encodedPerson: personClaim.encodedPerson }, "AccessApi");
      login({ jwt: userJwt }, undefined);
      return;
    }


    UserHelper.selectChurch(props.context, churchId, null).then(() => {
      continuedLoginProcess()
    });
  }

  const handleLoginErrors = (errors: string[]) => {
    setWelcomeBackName("");
    //if (errors[0] === "No permissions") setErrors(["The provided login does not have access to this application."]);
    //else 
    console.log(errors);
    setErrors(["Invalid login. Please check your email or password."]);
  }

  const login = (data: any, helpers?: FormikHelpers<any>) => {
    ApiHelper.postAnonymous("/users/login", data, "AccessApi")
      .then((resp: LoginResponseInterface) => {
        if (resp.errors) handleLoginErrors(resp.errors);
        else handleLoginSuccess(resp).then(() => { helpers?.setSubmitting(false) });
      })
      .catch((e) => { setErrors([e.toString()]); helpers?.setSubmitting(false); throw e; });

  };

  const getWelcomeBack = () => {
    if (welcomeBackName === "") return null;
    else {
      return <Alert variant="info">Welcome back, <b>{welcomeBackName}</b>!  Please wait while we load your data.</Alert>
    }
  }

  const getCheckEmail = () => {
    const search = new URLSearchParams(location.search);
    if (search.get("checkEmail") === "1") return <Alert variant="info">Thank you for registering.  Please check your email for your temporary password.</Alert>
  }

  const handleShowRegister = (e: React.MouseEvent) => {
    e.preventDefault();
    setShowRegister(true);
  }

  const getRegisterLink = () => {
    return (<><a href="about:blank" onClick={handleShowRegister}>Register</a> &nbsp; | &nbsp; </>);
  }

  const getLoginBox = () => {
    return (
      <div id="loginBox">
        <h2>Please sign in</h2>
        <Formik validationSchema={schema} initialValues={initialValues} onSubmit={login} >
          {({ handleSubmit, handleChange, values, touched, errors, isSubmitting }) => (
            <Form noValidate onSubmit={handleSubmit}>
              <Form.Group>
                <FormControl type="text" aria-label="email" id="email" name="email" value={values.email} onChange={handleChange} placeholder="Email address" isInvalid={touched.email && !!errors.email} />
                <Form.Control.Feedback type="invalid">{errors.email}</Form.Control.Feedback>
              </Form.Group>
              <Form.Group>
                <PasswordField value={values.password} onChange={handleChange} onKeyDown={e => e.key === "Enter" && login} isInvalid={touched.password && !!errors.password} errorText={errors.password} />
              </Form.Group>
              <Button type="submit" id="signInButton" size="lg" variant="primary" block disabled={isSubmitting}>
                {isSubmitting ? "Please wait..." : "Sign in"}
              </Button>
            </Form>
          )}
        </Formik>
        <br />
        <div className="text-right">
          {getRegisterLink()}
          <a href="/forgot">Forgot Password</a>&nbsp;
        </div>
      </div>);
  }


  const getLoginRegister = () => {
    if (!showRegister) return getLoginBox();
    else return (
      <div id="loginBox">
        <h2>Create an Account</h2>
        <Register updateErrors={setErrors} appName={props.appName} appUrl={props.appUrl} />
      </div>
    );
  }


  React.useEffect(init, []);

  const initialValues = { email: "", password: "" }

  if (redirectTo) return <Redirect to={redirectTo} />;
  else return (

    <div className="smallCenterBlock">
      <img src={props.logo || "/images/logo.png"} alt="logo" className="img-fluid" style={{ width: "100%", marginTop: 100, marginBottom: 60 }} />
      <ErrorMessages errors={errors} />
      {getWelcomeBack()}
      {getCheckEmail()}
      {getLoginRegister()}
      <SelectChurchModal show={showSelectModal} churches={loginResponse?.churches} selectChurch={selectChurch} />
    </div>
  );

};
