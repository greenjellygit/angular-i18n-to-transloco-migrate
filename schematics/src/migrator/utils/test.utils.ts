import {Message, MessageSpan} from '@angular/compiler/src/i18n/i18n_ast';

export class MessageHelper {

  public static builder(): MessageBuilder {
    return new MessageBuilder();
  }

}

export class MessageBuilder {

  private _customId: string;
  private _description: string;
  private _id: string;
  private _meaning: string;
  private _nodes: any[] = [];
  private _placeholderToMessage: { [p: string]: Message };
  private _placeholders: { [p: string]: string } = {};
  private _sources: MessageSpan[];

  public customId(value: string): MessageBuilder {
    this._customId = value;
    return this;
  }

  public description(value: string): MessageBuilder {
    this._description = value;
    return this;
  }

  public id(value: string): MessageBuilder {
    this._id = value;
    this._customId = value;
    return this;
  }

  public meaning(value: string): MessageBuilder {
    this._meaning = value;
    return this;
  }

  public nodes(value: any[]): MessageBuilder {
    this._nodes = value;
    return this;
  }

  public placeholderToMessage(value: { [p: string]: Message }): MessageBuilder {
    this._placeholderToMessage = value;
    return this;
  }

  public placeholders(value: { [p: string]: string }): MessageBuilder {
    this._placeholders = value;
    return this;
  }

  public sources(value: MessageSpan[]): MessageBuilder {
    this._sources = value;
    return this;
  }

  public build(): Message {
    const message = new Message(this._nodes, this._placeholders, this._placeholderToMessage, this._meaning, this._description, this._customId);
    message.sources = this._sources;
    return message;
  }

}
