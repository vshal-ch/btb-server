export function convertRowIntoSlotDetail(row, admin) {

  return {
    slot: {
      id: row.id,
      date: row.date,
      start_time: row.start_time,
      end_time: row.end_time,
      sport: row.sport,
      box: row.box,
      status: row.status,
      game_pass_code: row.game_pass_code,
      attended: row.attended,
      note: row.note,
      rescheduled_from_id: row.rescheduled_from_id,
      total_amount: row.total_amount,
      created_by_type: row.created_by_type,
    },
    payment: {
      amount: row.payment_amount,
      status: row.payment_status,
      failure_reason: row.failure_reason,
      order_id: row.order_id,
    },
    user: {
      name: row.user_name,
      email: row.email,
      phone_no: row.phone_no,
      avatar_url: row.avatar_url,
    },
    admin: {
      username: admin?.username,
    },
  };
}
