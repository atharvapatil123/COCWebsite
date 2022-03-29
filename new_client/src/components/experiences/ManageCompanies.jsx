import React, { useState, useEffect } from "react";
import Modal from "../Modal/Modal";
import { confirmAlert } from "react-confirm-alert";

import { Container, Box, Grid, Typography } from "@material-ui/core";
import { Divider, IconButton } from "@material-ui/core";
import Card from "@material-ui/core/Card";
import DeleteIcon from "@material-ui/icons/Delete";
import { makeStyles } from "@material-ui/core/styles";
import CardActions from "@material-ui/core/CardActions";
import CardContent from "@material-ui/core/CardContent";
import CardMedia from "@material-ui/core/CardMedia";
import Button from "@material-ui/core/Button";
import deshaw from "../assets/DEShaw.webp";
import AddCompany from "./AddCompany";
import axios from "axios";
import { connect } from "react-redux";
import useAuthenticatedAxios from "../Utilities/useAuthenticatedAxios.js";

const useStyles = makeStyles((theme) => ({
  root: {
    height: "100%",
    display: "flex",
    flexDirection: "column",
  },
  button: {
    marginTop: "10px",
  },
  cardContent: {
    display: "flex",
    flexDirection: "column",
    alignItems: "center",
  },
  link: {
    display: "flex",
    flexDirection: "column",
    alignItems: "center",
    padding: "15px 5px",
  },
  divider: {
    height: "1px",
    width: "80%",
    margin: "10px auto",
  },
}));

const ManageCompanies = (props) => {
  const classes = useStyles();

  const authenticatedAxios = useAuthenticatedAxios();
  const [companyList, setCompanyList] = useState([]);
  const [showModal, setShowModal] = useState(false);
  const [isModalClosing, setIsModalClosing] = useState(false);
  const [isDelete, setDelete] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [counter, setCounter] = useState(0);

  const handleModalClose = () => {
    setIsModalClosing(true);
    setCounter(counter + 1);
  };

  useEffect(() => {
    axios
      .get(process.env.REACT_APP_API + "/companies")
      .then((res) => {
        console.log(res.data);
        setCompanyList(res.data.companies);
        setIsLoading(false);
      })
      .catch((error) => {
        console.log(error);
        setIsLoading(false);
      });
  }, [counter, props.userID]);

  const handleDeleteCompany = (companyId) => {
    confirmAlert({
      title: "Confirm to delete",
      message: "Are you sure you want to delete the Company?",
      buttons: [
        {
          label: "Delete",
          onClick: async () => {
            const url = process.env.REACT_APP_API + `/company/${companyId}`;
            authenticatedAxios
              .delete(url)
              .then((res) => {
                if (res.status === 200) {
                  console.log("Deleted");
                } else {
                  console.log("Error");
                }
                setIsLoading(false);
              })
              .catch((err) => {
                // setIsError(true);
                setIsLoading(false);
                console.log("Error", err);
              });
            console.log(companyId);
          },
        },
        {
          label: "Cancel",
          onClick: () => {},
        },
      ],
    });
    //   }
  };

  return (
    <>
      <Box p={1} m={2}>
        <Container maxWidth="lg">
          <Grid container spacing={4}>
            <Grid item xs={12}>
              <Typography
                variant="h4"
                style={{ color: "#52b107" }}
                gutterBottom
              >
                Manage Companies
              </Typography>
            </Grid>

            {companyList.map((company, index) => {
              return (
                <Grid item xs={12} md={2}>
                  <Card className={classes.root}>
                    <div
                      style={{
                        display: "flex",
                        alignItem: "center",
                        justifyContent: "center",
                        height: "100%",
                      }}
                    >
                      <CardMedia
                        style={{
                          width: "100%",
                          objectFit: "contain",
                        }}
                        component="img"
                        image={company.image.url}
                        title="Contemplative Reptile"
                      />
                    </div>
                    <Divider className={classes.divider} />
                    <CardContent
                      style={{ flex: "1" }}
                      className={classes.cardContent}
                    >
                      <Typography
                        style={{ color: "#224903" }}
                        align="center"
                        variant="h6"
                      >
                        {company.title}
                      </Typography>
                    </CardContent>
                    <Container maxWidth="lg" className={classes.link}>
                      <Button
                        style={{ color: "rgb(181, 0, 23)" }}
                        align="center"
                        show={isDelete}
                        variant="outlined"
                        startIcon={<DeleteIcon />}
                        onClick={() => {
                          handleDeleteCompany(company._id);
                        }}
                      >
                        Delete
                      </Button>
                    </Container>
                  </Card>
                </Grid>
              );
            })}
          </Grid>
        </Container>
        <Modal
          size="xl"
          show={showModal}
          header="Add New Company"
          hasCloseBtn
          closeHandler={handleModalClose}
        >
          <AddCompany
            closeModal={() => {
              setShowModal(false);
              setCounter(counter + 1);
            }}
          />
        </Modal>
        <Modal
          size="sm"
          keyboard={false}
          show={isModalClosing}
          header="Close form"
          backdrop="static"
          closeHandler={() => {
            setShowModal(false);
            setIsModalClosing(false);
            setCounter(counter + 1);
          }}
          hasBtn
          btnText="Cancel"
          btnClickHandler={() => setIsModalClosing(false)}
        >
          <p>All form data will be lost</p>
        </Modal>
        <Modal
          size="sm"
          keyboard={false}
          show={isDelete}
          backdrop="static"
          closeHandler={() => {
            setShowModal(false);
            setDelete(false);
            setCounter(counter + 1);
          }}
          hasBtn
          btnText="Delete"
          btnClickHandler={() => setIsModalClosing(false)}
        >
          <p>Are you sure?</p>
        </Modal>
      </Box>
      <Divider className={classes.divider} />
      <Container maxWidth="lg" className={classes.link}>
        <Button
          style={{ color: "#224903" }}
          align="center"
          variant="contained"
          onClick={() => {
            setShowModal(true);
          }}
        >
          Add Company
        </Button>
      </Container>
    </>
  );
};

const mapStateToProps = (state) => ({
  isAuthenticated: state.auth.isAuthenticated,
  userID: state.auth.userID,
  token: state.auth.token,
});

export default connect(mapStateToProps)(ManageCompanies);
