const sendgridClient = require('@sendgrid/mail');


const sendCoachEmail = async (userData) => {
  /* eslint-disable */
  const {
    coach_email,
    coach_name,
    client_email,
    client_first_name,
    client_last_name,
    client_phone,
    client_plan_url
  } = userData;
  const message = {
    to: coach_email,
    from: 'support@helloroo.org',
    subject: 'Complete Workplan',
    templateId: '21c099ac-1957-4916-9195-83f9bf16dbe9',
    substitutions: {
      clientFirstname: client_first_name,
      clientLastname: client_last_name,
      clientEmail: client_email,
      clientPhone: client_phone,
      clientPlanUrl: client_plan_url,
      coachFirstName: coach_name
    },
  };
  sendgridClient.setApiKey(process.env.SENDGRID_API_KEY);
  await sendgridClient.send(message);
};

const sendPMEmail = async () => {
  console.log('Email sent');
};

exports.sendCoachEmail = sendCoachEmail;
exports.sendPMEmail = sendPMEmail;
