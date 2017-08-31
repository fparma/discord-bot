import { DiscordBot } from './../lib/bot';
import { AbstractCommand } from '../lib/commands/command'
import * as Discord from 'discord.js';
import { Database } from '../lib/database';
import * as mongodb from 'mongodb';
process.env.NODE_ENV = 'test';

class TestCmd extends AbstractCommand {
  type = '!test';
  usageInfo = 'usage test';
  handleMessage() { }
}

describe(DiscordBot.name, () => {
  let client: Discord.Client;
  let bot: DiscordBot;

  beforeEach(() => {
    client = new Discord.Client();
    bot = new DiscordBot(client, new Database(mongodb.MongoClient));
  })

  function mockDiscordMessage() {
    return {
      author: {
        username: 'tester',
        id: '106088523710345216'
      },
      channel: {
        send: () => { },
        startTyping: () => { },
        stopTyping: () => { },
      },
      content: ''
    }
  }

  it('connects', () => {
    const token = 'test';
    spyOn(client, 'login').and.callFake((arg: string) => {
      expect(arg).toEqual(token);
    });

    bot.connect(token);
  });

  it('registers a command', () => {
    expect(bot.registerCommand(new TestCmd)).toEqual(true);
    expect(bot.registerCommand(new TestCmd)).toEqual(false); // cannot register twice

    const cmd1 = new TestCmd();
    cmd1.type = 'requires a !';
    expect(bot.registerCommand(new TestCmd)).toEqual(false);
  })

  it('calls handleMessage for a specific command and sends a reply', async (done) => {
    const cmd = new TestCmd();
    bot.registerCommand(cmd);

    client.user = <Discord.ClientUser>{
      id: '123',
    };
    client.login = () => Promise.resolve('test');
    await bot.connect('test');

    const msg = mockDiscordMessage();
    const expectedArg = 'testArg';
    msg.content = cmd.type + ' ' + expectedArg;
    const expected = 'test reply';

    spyOn(cmd, 'handleMessage').and.callFake((arg: string, callback: Function) => {
      expect(arg).toEqual(expectedArg);
      callback(expected);
    });

    spyOn(msg.channel, 'send').and.callFake((arg: string) => {
      expect(arg).toEqual(expected);
      done();
    });

    process.nextTick(() => {
      client.emit('message', msg);
    })
  });
});
