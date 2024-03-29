const express = require('express');
const passport = require('passport');
const jwt = require('jsonwebtoken');
const UserService = require('./../services/user.service');
const MailSender = require('../utils/MailSender');
const bcrypt = require('bcrypt');


const { config } = require('../config/config')
const router = express.Router();
const userService = new UserService();
const mailSender = new MailSender();

router.post('/login',
  passport.authenticate('local', { session: false }),
  async (req, res, next) => {
    try {
      if (req.user.error) {
        res.json({
          error: true,
          message: 'Usuario o contraseña incorrectos'
        })
      }
      else {

        const user = req.user;
        const payload = {
          sub: user.id,
          role: user.role
        }
        const token = jwt.sign(payload, config.jwtSecret);
        console.log('enviar respuesta')
        res.json({
          error: false,
          content: {
            user,
            token
          }
        });
      }
    } catch (error) {
      res.json({
        error: true,
        message: error
      })
    }
  }
);

router.post('/recovery-password',
  async (req, res, next) => {
    try {
      const user = await userService.findByEmail(req.body.email);
      console.log(user)
      if (user) {
        const payload = {
          sub: user.id,
          role: user.role
        }

        const token = jwt.sign(payload, config.jwtSecret);
        let tempToken = token.replace(".", "-");
        do {
          tempToken = tempToken.replace(".", "-");
        } while (tempToken.includes("."));
        //mandar correo con direccion con parametro token
        const body = `Haga click en el enlace para recuperar su contraseña
        https://desatados.shop/new-password/${tempToken}`;

        mailSender.sendEmail(req.body.email,
          "Recuperacion de contraseña", body)
      }
      res.json({
        error: false,
        content: 'Correo enviado exitosamente'
      })
    } catch (error) {
      console.log(error)
      res.json({
        error: true,
        message: error
      })
    }
  }
);

router.post('/new-password',
  async (req, res, next) => {
    try {
      const token = req.body.token;
      const header = jwt.verify(token, config.jwtSecret, { complete: true })
      console.log(header.payload.sub)
      const user = await userService.findOne(header.payload.sub);

      if (user) {
        const hash = await bcrypt.hash(req.body.password, 10);

        await userService.update(header.payload.sub, { password: hash })
        res.json({
          error: false,
          message: 'usuario actualizado'
        })
      }
      else {
        res.json({
          error: true,
          message: 'Token invalido'
        })
      }
    } catch (error) {
      res.json({
        error: true,
        message: error
      })
    }
  }
);

router.post('/delete-my-data',
  async (req, res, next) => {
    try {
      const id = req.body.id;
      const changes = {
        facebookId: "deleted",
        email: `mail${id}@mail.com`
      }
      userService.update(id, changes);
      res.json({
        error: false,
        content: true
      })
    } catch (error) {
      res.json({
        error: true,
        message: error
      })
    }
  }
);

router.get("/login/success",
  (req, res) => {
    res.status(200).json({
      success: true,
      message: 'succesfull',
      user: req.user
    })
  }
);

router.get('/facebook',
  passport.authenticate('facebook', { scope: ['email'] }));

router.get('/google',
  passport.authenticate('google', { scope: ['email'] }));

router.get('/facebook/callback',
  passport.authenticate('facebook', { failureRedirect: 'https://desatados.shop/login', session: false }),
  function (req, res) {
    try {
      if (req.user.error) {
        res.redirect(`https://desatados.shop/`)
        res.json({
          error: true,
          message: 'Facebook no ha proporcionado un correo valido'
        });
      }
      else {
        let tempToken = req.user.replace(".", "%");
        do {
          tempToken = tempToken.replace(".", "%");
        } while (tempToken.includes("."));
        res.redirect(`https://desatados.shop/${tempToken}`)
      }
    } catch (error) {
      res.json({
        error: true,
        message: 'No hemos logrado conectar con facebook, intentalo de nuevo o utiliza alguna de las otras maneras de  autenticacion'
      })
    }
  }
);


router.get('/google/callback',
  passport.authenticate('google', { failureRedirect: 'https://desatados.shop/login', session: false }),
  function (req, res) {
    try {
      let tempToken = req.user;
      do {
        tempToken = tempToken.replace(".", "%");
      } while (tempToken.includes("."));
      console.log('------orig----')
      console.log(req.user)
      console.log('---replace------')
      console.log(tempToken)
      res.redirect(`https://desatados.shop/${tempToken}`)

    } catch (error) {
      res.json({
        error: true,
        message: 'No hemos logrado conectar con google, intentalo de nuevo o utiliza alguna de las otras maneras de  autenticacion'
      })
    }
  }
);

module.exports = router;
